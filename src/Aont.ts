import crypto from 'crypto'
import { splitData, numberToUint8Array, xorBytes, encrypt, concatenateUint8Arrays } from './utils.js'
export default class Aont {
  private static DATA_SIZE = 16

  // AOUTで元データを分割
  static transform(data: Uint8Array, publicKey: Uint8Array) {
    const key = crypto.randomBytes(16)
    const splitedatas = splitData(data, this.DATA_SIZE)

    let mPrime: Uint8Array[] = []
    let h: Uint8Array[] = []

    for (let i = 0; i < splitedatas.length; i++) {
      const indexBytes = numberToUint8Array(i)
      mPrime[i] = xorBytes(splitedatas[i], encrypt(key, indexBytes))
      h[i] = encrypt(publicKey, xorBytes(mPrime[i], indexBytes))
    }

    let shareKey = xorBytes(key, h[0])
    for (var i = 1; i < h.length; i++) {
      shareKey = xorBytes(shareKey, h[i])
    }
    mPrime[mPrime.length] = shareKey
    return mPrime
  }

  // シェアから元データを復元
  static inverseTransform(mPrime: Uint8Array[], publicKey: Uint8Array) {
    let m: Uint8Array[] = []
    let h: Uint8Array[] = []
    let shareKey = mPrime.pop()!
    for (let i = 0; i < mPrime.length; i++) {
      const indexBytes = numberToUint8Array(i)
      h[i] = encrypt(publicKey, xorBytes(mPrime[i], indexBytes))
    }

    for (let i = mPrime.length - 1; i > -1; i--) {
      shareKey = xorBytes(shareKey, h[i])
      const indexBytes = numberToUint8Array(i)
      m[i] = xorBytes(mPrime[i], encrypt(shareKey, indexBytes))
    }
    return concatenateUint8Arrays(m)
  }
}
