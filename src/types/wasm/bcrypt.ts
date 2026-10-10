/** Request payload posted to `src/workers/bcrypt.worker.ts` (the bridge adds `id`). */
export type BcryptWorkerRequest =
  | { type: 'hash'; password: string; rounds: number }
  | { type: 'verify'; password: string; hash: string }
