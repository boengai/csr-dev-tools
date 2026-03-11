import { NotoEmoji } from '@/components/common'

type BackgroundRemoverProcessingProps = {
  downloading: boolean
  progress: number
}

export const BackgroundRemoverProcessing = ({ downloading, progress }: BackgroundRemoverProcessingProps) => {
  return (
    <div aria-live="polite" className="flex grow flex-col items-center justify-center gap-3">
      <NotoEmoji emoji="robot" size={120} />
      {downloading ? (
        <>
          <p className="text-body-sm text-gray-300">Downloading AI model...</p>
          <div className="h-2 w-64 overflow-hidden rounded-full bg-gray-800">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-body-xs text-gray-500">{Math.round(progress)}%</p>
        </>
      ) : (
        <p className="text-body-sm text-gray-400">Removing background...</p>
      )}
    </div>
  )
}
