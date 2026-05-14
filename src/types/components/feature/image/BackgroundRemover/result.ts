export type BgOption = 'custom' | 'transparent' | 'white'

export type BackgroundRemoverResultProps = {
  bgOption: BgOption
  customColor: string
  onBgChange: (option: BgOption) => void
  onColorChange: (color: string) => void
}
