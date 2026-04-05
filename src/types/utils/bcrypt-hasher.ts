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
