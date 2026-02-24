export type BcryptHashResult = {
  elapsed: number
  hash: string
  rounds: number
}

export type BcryptVerifyResult = {
  elapsed: number
  match: boolean
}

export type BcryptHashComponents = {
  rounds: number
  salt: string
  version: string
}

export const hashPassword = async (
  password: string,
  rounds: number,
  onProgress?: (percent: number) => void,
): Promise<BcryptHashResult> => {
  const bcrypt = (await import('bcryptjs')).default
  const start = performance.now()

  const hash = await new Promise<string>((resolve, reject) => {
    bcrypt.hash(
      password,
      rounds,
      (err: Error | null, hash?: string) => {
        if (err) reject(err)
        else resolve(hash!)
      },
      (percent: number) => {
        onProgress?.(percent)
      },
    )
  })

  return {
    elapsed: performance.now() - start,
    hash,
    rounds,
  }
}

export const verifyPassword = async (password: string, hash: string): Promise<BcryptVerifyResult> => {
  const bcrypt = (await import('bcryptjs')).default
  const start = performance.now()
  const match = await bcrypt.compare(password, hash)

  return {
    elapsed: performance.now() - start,
    match,
  }
}

const BCRYPT_HASH_REGEX = /^\$2[aby]\$(0[4-9]|[12]\d|3[01])\$.{53}$/

export const isValidBcryptHash = (input: string): boolean => {
  return BCRYPT_HASH_REGEX.test(input) && input.length === 60
}

export const parseBcryptHash = (hash: string): BcryptHashComponents => {
  const version = hash.slice(1, 3)
  const rounds = parseInt(hash.slice(4, 6), 10)
  const salt = hash.slice(7, 29)

  return { rounds, salt, version }
}

export const checkPasswordTruncation = (password: string): boolean => {
  return new TextEncoder().encode(password).length > 72
}
