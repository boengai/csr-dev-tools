export type PlaceholderImageState = {
  bgColor: string
  bgHexInput: string
  height: string
  text: string
  textColor: string
  textHexInput: string
  width: string
}

export type PlaceholderImageAction =
  | { type: 'SET_BG_HEX'; value: string }
  | { type: 'SET_BG_PICKER'; hex: string }
  | { type: 'SET_HEIGHT'; value: string }
  | { type: 'SET_PRESET'; height: string; width: string }
  | { type: 'SET_TEXT'; value: string }
  | { type: 'SET_TEXT_COLOR_HEX'; value: string }
  | { type: 'SET_TEXT_COLOR_PICKER'; hex: string }
  | { type: 'SET_WIDTH'; value: string }
