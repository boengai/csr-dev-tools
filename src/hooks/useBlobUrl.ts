import { useEffect, useState } from 'react'

export const useBlobUrl = (blob: Blob | null): string | null => {
  const [url, setUrl] = useState<string | null>(null)

  // Object URLs are an external resource: creating and revoking one in the
  // same effect is what keeps StrictMode's mount/unmount/remount (and blob
  // swaps) leak-free, so the setState here is genuine external sync.
  useEffect(() => {
    if (!blob) {
      // oxlint-disable-next-line react/set-state-in-effect -- external resource sync (object URL lifecycle)
      setUrl(null)
      return
    }
    const next = URL.createObjectURL(blob)
    setUrl(next)
    return () => {
      URL.revokeObjectURL(next)
    }
  }, [blob])

  return url
}
