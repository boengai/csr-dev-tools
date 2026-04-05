import { Button, NotoEmoji, RefreshIcon } from '@/components/common'
import type { BackgroundRemoverErrorProps } from "@/types/components/feature/image/BackgroundRemover/error";

export const BackgroundRemoverError = ({ onReset }: BackgroundRemoverErrorProps) => {
  return (
    <div aria-live="assertive" className="flex grow flex-col items-center justify-center gap-3">
      <NotoEmoji emoji="bomb" size={120} />
      <p className="text-red-400 text-body-sm">Processing failed. Try a different image.</p>
      <Button icon={<RefreshIcon />} onClick={onReset} size="small">
        Try Again
      </Button>
    </div>
  )
}
