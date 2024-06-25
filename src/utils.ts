import crypto from 'crypto'

// Uint8Array to Hex
function uint8ArrayToHex(uint8Array: Uint8Array): string {
  return Array.from(uint8Array)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

function hexToUint8Array(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string')
  }
  const length = hex.length / 2
  const uint8Array = new Uint8Array(length)
  for (let i = 0; i < length; i++) {
    uint8Array[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return uint8Array
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

// AES復号(ecb mode)
function decrypt(key: Uint8Array, data: Uint8Array) {
  const cipher = crypto.createDecipheriv('aes-128-ecb', key, null)
  let decrypted = cipher.update(data)
  decrypted = Buffer.concat([decrypted, cipher.final()])
  return new Uint8Array(decrypted)
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

function bigintToUint8Array(bigint: BigInt) {
  // ビッグエンディアンでバイト配列に変換
  let hex = bigint.toString(16)
  if (hex.length % 2) {
    hex = '0' + hex // 奇数桁の場合は先頭に0を追加
  }
  const length = hex.length / 2
  const uint8Array = new Uint8Array(length)
  for (let i = 0; i < length; i++) {
    uint8Array[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return uint8Array
}

function uint8ArrayToBigint(uint8Array: Uint8Array) {
  // ビッグエンディアンのバイト配列からビッグインテジャーに変換
  let hex = ''
  uint8Array.forEach((byte) => {
    hex += byte.toString(16).padStart(2, '0')
  })
  return BigInt('0x' + hex)
}

export {
  uint8ArrayToHex,
  concatenateUint8Arrays,
  numberToUint8Array,
  xorBytes,
  encrypt,
  decrypt,
  splitData,
  bigintToUint8Array,
  uint8ArrayToBigint,
  hexToUint8Array,
}
