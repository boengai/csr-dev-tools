import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Button, CopyButton, Pane, SplitPanel, UploadInput } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast } from '@/hooks'
import type { PickedColorWithId, ToolComponentProps } from '@/types'
import { type PickedColor, getReadableContext2d, loadImageFromBlob, rafThrottle, readCanvasColorAt } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['image-color-picker']
export const ImageColorPicker = ({ autoOpen, onAfterClose }: ToolComponentProps) => {
  const { showError } = useToast()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const nextColorId = useRef(0)
  const [palette, setPalette] = useState<Array<PickedColorWithId>>([])
  const [hoverColor, setHoverColor] = useState<PickedColor | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!imageFile) return
    let cancelled = false
    loadImageFromBlob(imageFile)
      .then((img) => {
        if (cancelled) return
        const canvas = canvasRef.current
        if (!canvas) return
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = getReadableContext2d(canvas)
        if (!ctx) return
        ctx.drawImage(img, 0, 0)
      })
      .catch(() => {
        if (cancelled) return
        showError('Failed to load image')
      })
    return () => {
      cancelled = true
    }
  }, [imageFile, showError])

  const handleFileChange = useCallback(
    (files: Array<File>) => {
      const file = files[0]
      if (!file) return
      if (!file.type.startsWith('image/')) {
        showError('Upload a valid image file')
        return
      }
      setImageFile(file)
      setPalette([])
    },
    [showError],
  )

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const color = readCanvasColorAt(e.currentTarget, e.clientX, e.clientY)
    if (!color) return
    setPalette((prev) => [{ ...color, _id: nextColorId.current++ }, ...prev].slice(0, 10))
  }, [])

  // Created once so successive moves share one frame slot (at most one pixel read per frame).
  const updateHoverColor = useMemo(
    () =>
      rafThrottle((canvas: HTMLCanvasElement, clientX: number, clientY: number) =>
        setHoverColor(readCanvasColorAt(canvas, clientX, clientY)),
      ),
    [],
  )

  const handleCanvasMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => updateHoverColor(e.currentTarget, e.clientX, e.clientY),
    [updateHoverColor],
  )

  const handleReset = () => {
    setImageFile(null)
    setPalette([])
    setHoverColor(null)
  }

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterClose}
      onReset={handleReset}
      title="Color Picker from Image"
      triggers={[{ label: 'Open Color Picker' }]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <SplitPanel>
          <Pane gap="md">
            <UploadInput
              accept="image/*"
              button={{ block: true, children: 'Select Image' }}
              multiple={false}
              name="image-color-picker"
              onChange={handleFileChange}
            />
            {imageFile && (
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
          </Pane>

          <Pane gap="md">
            <span className="text-body-xs font-medium text-gray-400">Palette ({palette.length}/10)</span>
            {palette.length === 0 ? (
              <p className="text-body-sm text-gray-500">Click on the image to pick colors</p>
            ) : (
              <div className="flex flex-col gap-2 overflow-auto">
                {palette.map((color) => (
                  <div
                    className="flex items-center gap-3 rounded border border-gray-800 bg-gray-950 p-2"
                    key={color._id}
                  >
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
          </Pane>
        </SplitPanel>
      </div>
    </ToolDialogFrame>
  )
}
