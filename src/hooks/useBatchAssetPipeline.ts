import { useCallback, useEffect, useRef, useState } from 'react'

import type {
  BatchAssetProcess,
  BatchAssetProgress,
  UseBatchAssetPipelineOptions,
  UseBatchAssetPipelineResult,
} from '@/types'
import { downloadBlob } from '@/utils/download'
import { loadImageFromBlob } from '@/utils/image'
import { buildZipBlob } from '@/utils/zip'

import { useToast } from './state/useToast'
import { useBlobUrl } from './useBlobUrl'
import { useStaleSafeAsync } from './useStaleSafeAsync'

/**
 * Batch asset pipeline — owns the wiring shared by Tools that upload a single
 * image source and produce a batch of derived `Blob` results (e.g.
 * FaviconGenerator, SplashScreenGenerator). Composes:
 *
 *   - `useStaleSafeAsync` for race-free `regenerate()`
 *   - `loadImageFromBlob` for source decoding
 *   - `useBlobUrl` for the source preview URL lifecycle
 *   - `downloadBlob` / `buildZipBlob` for output
 *   - `useToast` for the reject / success / failure messages
 *
 * See CONTEXT.md → "Batch asset pipeline".
 */
export function useBatchAssetPipeline<TResults>(
  options: UseBatchAssetPipelineOptions,
): UseBatchAssetPipelineResult<TResults> {
  const { accept, failureToastLabel, mimePrefix, rejectToastLabel, successToastLabel } = options

  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null)
  const sourcePreview = useBlobUrl(sourceFile)
  const [results, setResults] = useState<TResults | null>(null)
  const [pending, setPending] = useState(false)
  const [progress, setProgress] = useState<BatchAssetProgress | null>(null)
  const [error, setError] = useState<unknown | null>(null)

  // Synchronous shadow of `sourceImage` so a back-to-back `await upload(); await
  // regenerate();` in the same handler reads the freshly-decoded image —
  // without it, `regenerate` would close over the previous render's `null`.
  const sourceImageRef = useRef<HTMLImageElement | null>(null)

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const newSession = useStaleSafeAsync()
  // Separate counter for uploads: a newer upload supersedes an older decode
  // still in flight, without a rejected upload cancelling a running regenerate.
  const newUploadSession = useStaleSafeAsync()
  const showError = useToast((s) => s.showError)
  const showSuccess = useToast((s) => s.showSuccess)

  const upload = useCallback(
    async (files: Array<File>): Promise<boolean> => {
      const file = files[0]
      if (!file) return false

      if (mimePrefix && !file.type.startsWith(mimePrefix)) {
        showError(rejectToastLabel)
        return false
      }

      const uploadSession = newUploadSession()
      let image: HTMLImageElement
      try {
        image = await loadImageFromBlob(file)
      } catch {
        if (!mountedRef.current || !uploadSession.isFresh()) return false
        showError(rejectToastLabel)
        return false
      }
      if (!mountedRef.current || !uploadSession.isFresh()) return false

      // The source changed: any regenerate still running against the old
      // image is now stale and must not write its results back.
      newSession()
      sourceImageRef.current = image
      setSourceFile(file)
      setSourceImage(image)
      setResults(null)
      setProgress(null)
      setError(null)
      setPending(false)
      return true
    },
    [mimePrefix, newSession, newUploadSession, rejectToastLabel, showError],
  )

  const regenerate = useCallback(
    async (process: BatchAssetProcess<TResults>) => {
      const image = sourceImageRef.current
      if (!image) return

      const session = newSession()
      setPending(true)
      setError(null)
      setProgress(null)

      const report = (current: number, total: number) => {
        session.ifFresh(() => {
          if (mountedRef.current) setProgress({ current, total })
        })
      }

      try {
        const next = await process(image, report)
        session.ifFresh(() => {
          if (!mountedRef.current) return
          setResults(next)
          setProgress(null)
          setPending(false)
          if (successToastLabel) {
            showSuccess(successToastLabel)
          }
        })
      } catch (err) {
        session.ifFresh(() => {
          if (!mountedRef.current) return
          setError(err)
          setProgress(null)
          setPending(false)
          showError(failureToastLabel)
        })
      }
    },
    [failureToastLabel, newSession, successToastLabel, showError, showSuccess],
  )

  const downloadOne = useCallback((blob: Blob, filename: string) => {
    downloadBlob(blob, filename)
  }, [])

  const downloadAll = useCallback(async (zipName: string, files: Record<string, Blob | string>) => {
    const blob = await buildZipBlob(files)
    downloadBlob(blob, zipName)
  }, [])

  const openFilePicker = useCallback(
    () =>
      new Promise<boolean>((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = accept
        input.style.display = 'none'
        input.onchange = () => {
          const fileList = input.files
          const picked = fileList ? Array.from(fileList) : []
          input.remove()
          if (picked.length > 0) void upload(picked).then(resolve, () => resolve(false))
          else resolve(false)
        }
        input.oncancel = () => {
          input.remove()
          resolve(false)
        }
        document.body.appendChild(input)
        input.click()
      }),
    [accept, upload],
  )

  const reset = useCallback(() => {
    // Bumping the sessions guarantees any in-flight regenerate / decode
    // becomes stale and cannot write back over the cleared state.
    newSession()
    newUploadSession()
    sourceImageRef.current = null
    setSourceFile(null)
    setSourceImage(null)
    setResults(null)
    setProgress(null)
    setError(null)
    setPending(false)
  }, [newSession, newUploadSession])

  return {
    downloadAll,
    downloadOne,
    error,
    openFilePicker,
    pending,
    progress,
    regenerate,
    reset,
    results,
    sourceFile,
    sourceImage,
    sourcePreview,
    upload,
  }
}
