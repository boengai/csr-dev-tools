export type RsaKeySize = 2048 | 4096

export type RsaKeyPair = {
  privateKey: string
  publicKey: string
}

export const arrayBufferToPem = (buffer: ArrayBuffer, label: string): string => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const base64 = btoa(binary)
  const lines = base64.match(/.{1,64}/g)?.join('\n') ?? ''
  return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`
}

export const generateRsaKeyPair = async (keySize: RsaKeySize): Promise<RsaKeyPair> => {
  const algorithm: RsaHashedKeyGenParams = {
    hash: 'SHA-256',
    modulusLength: keySize,
    name: 'RSA-OAEP',
    publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
  }

  const keyPair = await crypto.subtle.generateKey(algorithm, true, ['encrypt', 'decrypt'])

  const publicDer = await crypto.subtle.exportKey('spki', keyPair.publicKey)
  const privateDer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)

  return {
    privateKey: arrayBufferToPem(privateDer, 'PRIVATE KEY'),
    publicKey: arrayBufferToPem(publicDer, 'PUBLIC KEY'),
  }
}

export const downloadPemFile = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'application/x-pem-file' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
