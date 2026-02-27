import { useCallback, useRef, useState } from 'react'

import type { ToolComponentProps } from '@/types'
import type { PickedColor } from '@/utils/color-picker'

import { Button, CopyButton, Dialog, UploadInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { pixelToColor } from '@/utils/color-picker'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rafThrottle = <T extends (...args: Array<any>) => void>(fn: T): T => {
  let frame: number | null = null
  return ((...args: Array<unknown>) => {
    if (frame) return
    frame = requestAnimationFrame(() => {
      fn(...args)
      frame = null
    })
  }) as unknown as T
}

const toolEntry = TOOL_REGISTRY_MAP['image-color-picker']

export const ImageColorPicker = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const [imageUrl, setImageUrl] = useState('')
  const [palette, setPalette] = useState<Array<PickedColor>>([])
  const [hoverColor, setHoverColor] = useState<PickedColor | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFileChange = useCallback(
    (files: Array<File>) => {
      const file = files[0]
      if (!file) return
      if (imageUrl) URL.revokeObjectURL(imageUrl)
      const url = URL.createObjectURL(file)
      setImageUrl(url)
      setPalette([])

      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, 0, 0)
      }
      img.src = url
    },
    [imageUrl],
  )

  const getColorAt = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = Math.min(Math.max(Math.floor((e.clientX - rect.left) * scaleX), 0), canvas.width - 1)
    const y = Math.min(Math.max(Math.floor((e.clientY - rect.top) * scaleY), 0), canvas.height - 1)
    const pixel = ctx.getImageData(x, y, 1, 1).data
    return pixelToColor(pixel[0], pixel[1], pixel[2])
  }, [])

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const color = getColorAt(e)
      if (!color) return
      setPalette((prev) => [color, ...prev].slice(0, 10))
    },
    [getColorAt],
  )

  const handleCanvasMove = useCallback(
    rafThrottle((e: React.MouseEvent<HTMLCanvasElement>) => {
      setHoverColor(getColorAt(e))
    }),
    [getColorAt],
  )

  const handleReset = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setImageUrl('')
    setPalette([])
    setHoverColor(null)
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}
        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => setDialogOpen(true)} variant="default">
            Open Color Picker
          </Button>
        </div>
      </div>
      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={() => {
          handleReset()
          onAfterDialogClose?.()
        }}
        size="screen"
        title="Color Picker from Image"
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
              <UploadInput
                accept="image/*"
                button={{ block: true, children: 'Select Image' }}
                multiple={false}
                name="image-color-picker"
                onChange={handleFileChange}
              />
              {imageUrl && (
                <div className="relative overflow-auto rounded-lg border border-gray-800">
                  <canvas
                    className="max-h-[500px] w-full cursor-crosshair object-contain"
                    onClick={handleCanvasClick}
                    onMouseMove={handleCanvasMove}
                    ref={canvasRef}
                  />
                </div>
              )}
              {hoverColor && (
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded border border-gray-700" style={{ backgroundColor: hoverColor.hex }} />
                  <span className="font-mono text-body-xs text-gray-400">{hoverColor.hex}</span>
                </div>
              )}
            </div>

            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
              <span className="text-body-xs font-medium text-gray-400">Palette ({palette.length}/10)</span>
              {palette.length === 0 ? (
                <p className="text-body-sm text-gray-500">Click on the image to pick colors</p>
              ) : (
                <div className="flex flex-col gap-2 overflow-auto">
                  {palette.map((color, i) => (
                    <div className="flex items-center gap-3 rounded border border-gray-800 bg-gray-950 p-2" key={i}>
                      <div className="size-10 shrink-0 rounded" style={{ backgroundColor: color.hex }} />
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-body-xs text-gray-200">{color.hex}</span>
                          <CopyButton label="HEX" value={color.hex} />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-body-xs text-gray-400">{color.rgb}</span>
                          <CopyButton label="RGB" value={color.rgb} />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-body-xs text-gray-400">{color.hsl}</span>
                          <CopyButton label="HSL" value={color.hsl} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {palette.length > 0 && (
                <Button onClick={() => setPalette([])} variant="default">
                  Clear Palette
                </Button>
              )}
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}
