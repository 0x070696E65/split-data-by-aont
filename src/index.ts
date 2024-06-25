import crypto from 'crypto'
import Aont from './Aont.js'
import { uint8ArrayToHex, bigintToUint8Array, hexToUint8Array, uint8ArrayToBigint } from './utils.js'
import { SymbolFacade, Verifier } from 'symbol-sdk/symbol'
import { PrivateKey, Signature } from 'symbol-sdk'
import { split, combine } from 'shamirs-secret-sharing-ts'
import fs from 'fs'

const publicKey = crypto.randomBytes(16)

// 生データであればなんでも良い、サイズも不問
const originalData = new Uint8Array(fs.readFileSync('/Users/matsukawatoshiya/Desktop/ibc_token.png'))
const facade = new SymbolFacade('testnet')

// publisherはサーバーサイドで署名できるなど自動化しておくと良い
// publisherとしているがゲームデータであればemulatorかもしれないしviewerかもしれないし、何かしらデータを取り扱う第三者機関のこと
const publisher = facade.createAccount(PrivateKey.random())

// authorは基本的に署名が必要なのは購入者がNFT等を購入する際だけ
const author = facade.createAccount(PrivateKey.random())
const purchaser = facade.createAccount(PrivateKey.random())

// AONTによる分散
const mPrime = Aont.transform(originalData, publicKey)
// データを2つに分割したのでそれぞれmetalで保存などしておく
// 別に一つでも良いと思うがどこまで分散化させるかの話
const storage = []
for (let i = 0; i < mPrime.length; i++) {
  if (i + 1 == mPrime.length) {
    console.log(`sharedKey: 0x${uint8ArrayToHex(mPrime[i])}`)
    continue
  }
  storage.push(mPrime[i])
}

// シャミアの秘密分散によりShareKeyを分割
const secret = mPrime.slice(-1)[0]
const shares = split(Buffer.from(secret.buffer), { shares: 3, threshold: 2 })

const splitKeyForPublisher = shares[0] // これはサーバーサイド管理
const splitKeyForAuthor = shares[1] // Authorが自身で管理

// 期限付きトークン
const exprirydate = bigintToUint8Array(facade.now().addHours(2).timestamp)
const token = publisher.keyPair.sign(exprirydate)
const tokenData = {
  token: uint8ArrayToHex(token.bytes),
  exprirydate: uint8ArrayToHex(exprirydate),
}

// 購入者によるトークンの暗号化
const signature = purchaser
  .messageEncoder()
  .encode(publisher.publicKey, new TextEncoder().encode(JSON.stringify(tokenData)))

// publisherによる検証フェーズ
const decryptSignature = publisher.messageEncoder().tryDecode(purchaser.publicKey, signature)
// 復号可能か
if (!decryptSignature.isDecoded) throw new Error('not verified')

const decryptedToken = JSON.parse(new TextDecoder().decode(decryptSignature.message))

// tokenはpublisherによるものか
const sig = new Signature(hexToUint8Array(decryptedToken.token))
const uint8ArrayExpirydate = hexToUint8Array(decryptedToken.exprirydate)

if (!new Verifier(publisher.publicKey).verify(uint8ArrayExpirydate, sig)) throw new Error('not verified')

const expired = uint8ArrayToBigint(uint8ArrayExpirydate)
const now = facade.now().timestamp

if (expired < now) throw new Error('expired token')

// 購入者公開鍵を元に該当Mosaicの所有確認
const hasMosaic = true

if (!hasMosaic) throw new Error('do not have the mosaic')

// シャミアによるKeyの復元
const recoveredSecret = combine([splitKeyForPublisher, shares[2]])

// データの復元
const datasBeforeRestore = storage.concat(recoveredSecret)
const restoredData = Aont.inverseTransform(datasBeforeRestore, publicKey)

// 元のデータと復元されたデータが一致するか確認
console.assert(Buffer.compare(originalData, restoredData) === 0, 'Failed to restore the original data.')
console.log('Data restoration successful.')

// 何かしら問題が出てkeyを再生成する場合
const recoveredSecretForNewPurchaser = combine([splitKeyForPublisher, splitKeyForAuthor])
const newSplitKey = split(recoveredSecretForNewPurchaser, { shares: 3, threshold: 2 })

// そもそもの元データ等が漏れるなどの不具合にはmetalの削除、再生成などで対応可能
