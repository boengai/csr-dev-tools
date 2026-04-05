export type FlexDirection = 'column' | 'column-reverse' | 'row' | 'row-reverse'

export type JustifyContent = 'center' | 'flex-end' | 'flex-start' | 'space-around' | 'space-between' | 'space-evenly'

export type AlignItems = 'baseline' | 'center' | 'flex-end' | 'flex-start' | 'stretch'

export type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse'

export type FlexboxContainerProps = {
  alignItems: AlignItems
  direction: FlexDirection
  gap: number
  justifyContent: JustifyContent
  wrap: FlexWrap
}

export type FlexboxItemProps = {
  flexGrow: number
  flexShrink: number
  order: number
}
