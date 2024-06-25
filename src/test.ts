import crypto from 'crypto'

// Uint8Array to Hex
function uint8ArrayToHex(uint8Array: Uint8Array): string {
  return Array.from(uint8Array)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

// Uint8Arary[]を結合する関数
function concatenateUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  let totalLength = 0
  for (const arr of arrays) {
    totalLength += arr.length
  }

  const concatenatedArray = new Uint8Array(totalLength)
  let offset = 0
  for (const arr of arrays) {
    concatenatedArray.set(arr, offset)
    offset += arr.length
  }

  return concatenatedArray
}

// number型をUint8Arrayに変換
function numberToUint8Array(num: number): Uint8Array {
  const arr = new Uint8Array(4)
  arr[0] = num & 0xff
  arr[1] = (num >> 8) & 0xff
  arr[2] = (num >> 16) & 0xff
  arr[3] = (num >> 24) & 0xff
  return arr
}

// バイト列をXOR変換する関数
function xorBytes(data1: Uint8Array, data2: Uint8Array): Uint8Array {
  const result = new Uint8Array(data1.length)
  for (let i = 0; i < data1.length; i++) {
    result[i] = data1[i] ^ data2[i]
  }
  return result
}

// AES暗号化(ecb mode)
function encrypt(key: Uint8Array, data: Uint8Array) {
  const cipher = crypto.createCipheriv('aes-128-ecb', key, null)
  let encrypted = cipher.update(data)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return new Uint8Array(encrypted)
}

// データを適切な長さに分割して返す関数
function splitData(originalData: Uint8Array, dataSize: number): Uint8Array[] {
  const parts: Uint8Array[] = []
  let offset = 0
  while (offset < originalData.length) {
    parts.push(originalData.slice(offset, offset + dataSize))
    offset += dataSize
  }
  return parts
}

// AOUTで元データを分割
function aontTransform(data: Uint8Array, publicKey: Uint8Array) {
  const key = crypto.randomBytes(16)
  const splitedatas = splitData(data, 16)

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
function aontInverseTransform(mPrime: Uint8Array[], publicKey: Uint8Array) {
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

const publicKey = crypto.randomBytes(16)
const message = 'hello, symbol!!!'

// AONTによる分散
const mPrime = aontTransform(new Uint8Array(Buffer.from(message, 'utf-8')), publicKey)

for (let i = 0; i < mPrime.length; i++) {
  if (i + 1 == mPrime.length) {
    console.log(`sharedKey: 0x${uint8ArrayToHex(mPrime[i])}`)
    continue
  }
  console.log(`share ${i}: 0x${uint8ArrayToHex(mPrime[i])}`)
}

// 復元
const restoredMessage = Buffer.from(aontInverseTransform(mPrime, publicKey)).toString('utf-8')

// 結果の表示
console.log('Original Message   :', message)
console.log('Restored Message   :', restoredMessage)

// 元のデータと復元されたデータが一致するか確認
console.assert(message.toString() === restoredMessage.toString(), 'Failed to restore the original data.')
console.log('Data restoration successful.')
