export type ValidityStatus = 'expired' | 'not-yet-valid' | 'valid'

export type CertificateExtension = {
  critical: boolean
  name: string
  oid: string
  value: string
}

export type CertificateInfo = {
  extensions: Array<CertificateExtension>
  isValid: boolean
  issuer: string
  notAfter: Date
  notBefore: Date
  publicKeyAlgorithm: string
  publicKeySize: number
  serialNumber: string
  signatureAlgorithm: string
  subject: string
  validityStatus: ValidityStatus
}

const MAX_INPUT_LENGTH = 32_768

const PRIVATE_KEY_PATTERN = /-----BEGIN.*PRIVATE KEY-----/

const PEM_CERT_PATTERN = /-----BEGIN CERTIFICATE-----/

const KEY_USAGE_FLAGS = [
  'Digital Signature',
  'Non Repudiation',
  'Key Encipherment',
  'Data Encipherment',
  'Key Agreement',
  'Key Cert Sign',
  'CRL Sign',
  'Encipher Only',
  'Decipher Only',
]

const EKU_NAMES: Record<string, string> = {
  '1.3.6.1.5.5.7.3.1': 'Server Authentication',
  '1.3.6.1.5.5.7.3.2': 'Client Authentication',
  '1.3.6.1.5.5.7.3.3': 'Code Signing',
  '1.3.6.1.5.5.7.3.4': 'Email Protection',
  '1.3.6.1.5.5.7.3.8': 'Time Stamping',
  '1.3.6.1.5.5.7.3.9': 'OCSP Signing',
}

export const getValidityStatus = (notBefore: Date, notAfter: Date, now = new Date()): ValidityStatus => {
  if (now < notBefore) return 'not-yet-valid'
  if (now > notAfter) return 'expired'
  return 'valid'
}

export const isValidPemCertificate = (input: string): boolean => {
  return PEM_CERT_PATTERN.test(input)
}

export const formatDistinguishedName = (dn: string): string => {
  return dn
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ')
}

const formatSerialNumber = (hex: string): string => {
  const clean = hex.replace(/^0+/, '').toLowerCase()
  if (!clean) return '00'
  const padded = clean.length % 2 !== 0 ? `0${clean}` : clean
  return padded.match(/.{2}/g)?.join(':') ?? padded
}

const toHex = (buffer: ArrayBuffer): string => {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join(':')
}

const formatHexId = (hex: string): string => {
  const clean = hex.toLowerCase().replace(/[^0-9a-f]/g, '')
  if (!clean) return hex
  return clean.match(/.{2}/g)?.join(':') ?? clean
}

const getPublicKeyAlgorithmInfo = (algo: KeyAlgorithm): { algorithm: string; size: number } => {
  if ('namedCurve' in algo) {
    const curveMap: Record<string, number> = {
      'P-256': 256,
      'P-384': 384,
      'P-521': 521,
    }
    const curveName = (algo as { namedCurve: string }).namedCurve
    return { algorithm: 'ECDSA', size: curveMap[curveName] ?? 0 }
  }

  if ('modulusLength' in algo) {
    return { algorithm: 'RSA', size: (algo as { modulusLength: number }).modulusLength }
  }

  const algoName = ('name' in algo ? (algo as { name: string }).name : 'Unknown').toUpperCase()
  if (algoName === 'ED25519') return { algorithm: 'Ed25519', size: 256 }
  if (algoName === 'ED448') return { algorithm: 'Ed448', size: 456 }

  return { algorithm: algoName, size: 0 }
}

const parseSanExtension = (
  rawData: ArrayBuffer,
  SanCtor: typeof import('@peculiar/x509').SubjectAlternativeNameExtension,
): string => {
  try {
    const san = new SanCtor(rawData)
    const names: Array<string> = []
    const items = (san.names as unknown as { items?: Array<{ type: string; value: string }> })?.items
    if (Array.isArray(items)) {
      for (const entry of items) {
        const prefix =
          entry.type === 'dns'
            ? 'DNS'
            : entry.type === 'ip'
              ? 'IP'
              : entry.type === 'email'
                ? 'Email'
                : entry.type.toUpperCase()
        names.push(`${prefix}:${entry.value}`)
      }
    }
    return names.join(', ')
  } catch {
    return toHex(rawData)
  }
}

const parseKeyUsageExtension = (
  rawData: ArrayBuffer,
  KuCtor: typeof import('@peculiar/x509').KeyUsagesExtension,
): string => {
  try {
    const ku = new KuCtor(rawData)
    const flags: Array<string> = []
    const usages = ku.usages
    KEY_USAGE_FLAGS.forEach((flag, idx) => {
      if (usages & (1 << idx)) flags.push(flag)
    })
    return flags.join(', ')
  } catch {
    return toHex(rawData)
  }
}

const parseEkuExtension = (
  rawData: ArrayBuffer,
  EkuCtor: typeof import('@peculiar/x509').ExtendedKeyUsageExtension,
): string => {
  try {
    const eku = new EkuCtor(rawData)
    return Array.from(eku.usages)
      .map((u) => EKU_NAMES[String(u)] ?? String(u))
      .join(', ')
  } catch {
    return toHex(rawData)
  }
}

const parseBasicConstraintsExtension = (
  rawData: ArrayBuffer,
  BcCtor: typeof import('@peculiar/x509').BasicConstraintsExtension,
): string => {
  try {
    const bc = new BcCtor(rawData)
    const caStr = bc.ca ? 'true' : 'false'
    const pathLen = bc.pathLength !== undefined ? `, Path Length: ${bc.pathLength}` : ''
    return `CA: ${caStr}${pathLen}`
  } catch {
    return toHex(rawData)
  }
}

export const parsePemCertificate = async (input: string): Promise<CertificateInfo> => {
  if (input.length > MAX_INPUT_LENGTH) {
    throw new Error('Input too large. Certificates are typically under 4 KB.')
  }

  if (PRIVATE_KEY_PATTERN.test(input)) {
    throw new Error('This appears to be a private key. Only paste certificates for security.')
  }

  if (!isValidPemCertificate(input)) {
    const pemPattern = /-----BEGIN\s+(\w[\w\s]*\w)\s*-----/
    const match = pemPattern.exec(input)
    if (match) {
      throw new Error('This does not appear to be a certificate. Paste a PEM-encoded X.509 certificate.')
    }
    throw new Error('Certificate format not recognized. Paste a PEM-encoded certificate (-----BEGIN CERTIFICATE-----)')
  }

  const x509 = await import('@peculiar/x509')

  let cert: InstanceType<typeof x509.X509Certificate>
  try {
    cert = new x509.X509Certificate(input)
  } catch {
    throw new Error('Certificate format not recognized. Paste a PEM-encoded certificate (-----BEGIN CERTIFICATE-----)')
  }

  const notBefore = cert.notBefore
  const notAfter = cert.notAfter
  const validityStatus = getValidityStatus(notBefore, notAfter)
  const isValid = validityStatus === 'valid'

  const sigAlg = cert.signatureAlgorithm as { hash?: { name?: string }; name?: string }
  let signatureAlgorithm = sigAlg.name ?? ''
  if (sigAlg.hash?.name) {
    const algoShort = signatureAlgorithm.includes('RSA') ? 'RSA' : signatureAlgorithm
    signatureAlgorithm = `${sigAlg.hash.name} with ${algoShort}`
  }

  const pkInfo = getPublicKeyAlgorithmInfo(cert.publicKey.algorithm)

  const extensions: Array<CertificateExtension> = []
  for (const ext of cert.extensions) {
    const oid = ext.type

    if (oid === '2.5.29.17') {
      extensions.push({
        critical: ext.critical,
        name: 'Subject Alternative Name',
        oid,
        value: parseSanExtension(ext.rawData, x509.SubjectAlternativeNameExtension),
      })
    } else if (oid === '2.5.29.15') {
      extensions.push({
        critical: ext.critical,
        name: 'Key Usage',
        oid,
        value: parseKeyUsageExtension(ext.rawData, x509.KeyUsagesExtension),
      })
    } else if (oid === '2.5.29.37') {
      extensions.push({
        critical: ext.critical,
        name: 'Extended Key Usage',
        oid,
        value: parseEkuExtension(ext.rawData, x509.ExtendedKeyUsageExtension),
      })
    } else if (oid === '2.5.29.19') {
      extensions.push({
        critical: ext.critical,
        name: 'Basic Constraints',
        oid,
        value: parseBasicConstraintsExtension(ext.rawData, x509.BasicConstraintsExtension),
      })
    } else if (oid === '2.5.29.14') {
      let skiValue: string
      try {
        const ski = new x509.SubjectKeyIdentifierExtension(ext.rawData)
        skiValue = formatHexId(ski.keyId)
      } catch {
        skiValue = toHex(ext.rawData)
      }
      extensions.push({ critical: ext.critical, name: 'Subject Key Identifier', oid, value: skiValue })
    } else if (oid === '2.5.29.35') {
      let akiValue: string
      try {
        const aki = new x509.AuthorityKeyIdentifierExtension(ext.rawData)
        akiValue = aki.keyId ? formatHexId(aki.keyId) : toHex(ext.rawData)
      } catch {
        akiValue = toHex(ext.rawData)
      }
      extensions.push({ critical: ext.critical, name: 'Authority Key Identifier', oid, value: akiValue })
    } else {
      extensions.push({ critical: ext.critical, name: `Extension (${oid})`, oid, value: toHex(ext.rawData) })
    }
  }

  return {
    extensions,
    isValid,
    issuer: formatDistinguishedName(cert.issuer),
    notAfter,
    notBefore,
    publicKeyAlgorithm: pkInfo.algorithm,
    publicKeySize: pkInfo.size,
    serialNumber: formatSerialNumber(cert.serialNumber),
    signatureAlgorithm,
    subject: formatDistinguishedName(cert.subject),
    validityStatus,
  }
}
