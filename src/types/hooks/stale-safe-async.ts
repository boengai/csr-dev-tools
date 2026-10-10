export type StaleSafeSession = {
  /** True iff no newer session has been started since this one. */
  isFresh: () => boolean
  /** Run `fn` only if this session is still fresh; otherwise return undefined. */
  ifFresh: <T>(fn: () => T) => T | undefined
}
