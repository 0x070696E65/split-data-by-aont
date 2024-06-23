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
function splitData(originalData: Uint8Array, num: number, splitedDataSize: Uint8Array | null = null): Uint8Array[] {
  const parts: Uint8Array[] = []
  const dataLength = originalData.length

  if (splitedDataSize == null) {
    const shareLength = Math.floor(dataLength / num)
    const dataLengthReminder = dataLength % num

    for (let i = 0; i < num; i++) {
      const part =
        i === num - 1
          ? originalData.slice(i * shareLength, (i + 1) * shareLength + dataLengthReminder)
          : originalData.slice(i * shareLength, (i + 1) * shareLength)
      parts.push(part)
    }
    return parts
  } else {
    const totalSize = sumUint8Array(splitedDataSize)
    if (dataLength != totalSize) throw new Error('Splited data size is not equal to data size.')

    let offset = 0
    for (let i = 0; i < splitedDataSize.length; i++) {
      parts.push(originalData.slice(offset, offset + splitedDataSize[i]))
      offset += splitedDataSize[i]
    }
    return parts
  }
}

function sumUint8Array(arr: Uint8Array): number {
  let sum = 0
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i]
  }
  return sum
}

export { uint8ArrayToHex, concatenateUint8Arrays, numberToUint8Array, xorBytes, encrypt, splitData }
