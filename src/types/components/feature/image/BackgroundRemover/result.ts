export type BgOption = 'custom' | 'transparent' | 'white'

export type BackgroundRemoverResultProps = {
  bgOption: BgOption
  customColor: string
  displayUrl: string
  onBgChange: (option: BgOption) => void
  onColorChange: (color: string) => void
  onConfirm: () => void
  sourcePreview: string
}
