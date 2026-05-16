import { useCallback, useEffect, useRef, useState } from 'react'

import type {
  BatchAssetProcess,
  BatchAssetProgress,
  UseBatchAssetPipelineOptions,
  UseBatchAssetPipelineResult,
} from '@/types'
import { downloadBlob } from '@/utils/download'
import { loadImageFromFile } from '@/utils/image'
import { buildZipBlob } from '@/utils/zip'
import { useToast } from './state/useToast'
import { useStaleSafeAsync } from './useStaleSafeAsync'

/**
 * Batch asset pipeline — owns the wiring shared by Tools that upload a single
 * image source and produce a batch of derived `Blob` results (e.g.
 * FaviconGenerator, SplashScreenGenerator). Composes:
 *
 *   - `useStaleSafeAsync` for race-free `regenerate()`
 *   - `loadImageFromFile` for source decoding
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
  const [sourcePreview, setSourcePreview] = useState<string | null>(null)
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
  const { showError, showSuccess } = useToast()

  // Revoke the previous source preview when it changes or on unmount.
  useEffect(() => {
    if (!sourcePreview) return
    return () => {
      URL.revokeObjectURL(sourcePreview)
    }
  }, [sourcePreview])

  const upload = useCallback(
    async (files: Array<File>) => {
      const file = files[0]
      if (!file) return

      if (mimePrefix && !file.type.startsWith(mimePrefix)) {
        showError(rejectToastLabel)
        return
      }

      let image: HTMLImageElement
      try {
        image = await loadImageFromFile(file)
      } catch {
        if (!mountedRef.current) return
        showError(rejectToastLabel)
        return
      }
      if (!mountedRef.current) return

      sourceImageRef.current = image
      setSourceFile(file)
      setSourceImage(image)
      setSourcePreview(URL.createObjectURL(file))
      setResults(null)
      setProgress(null)
      setError(null)
    },
    [mimePrefix, rejectToastLabel, showError],
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

  const openFilePicker = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.style.display = 'none'
    input.onchange = () => {
      const fileList = input.files
      const picked = fileList ? Array.from(fileList) : []
      input.remove()
      if (picked.length > 0) void upload(picked)
    }
    document.body.appendChild(input)
    input.click()
  }, [accept, upload])

  const reset = useCallback(() => {
    // Bumping the session via newSession() guarantees any in-flight regenerate
    // becomes stale and cannot write back over the cleared state.
    newSession()
    sourceImageRef.current = null
    setSourceFile(null)
    setSourceImage(null)
    setSourcePreview(null)
    setResults(null)
    setProgress(null)
    setError(null)
    setPending(false)
  }, [newSession])

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
