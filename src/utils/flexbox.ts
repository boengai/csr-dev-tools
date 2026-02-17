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

export const DEFAULT_CONTAINER: FlexboxContainerProps = {
  alignItems: 'stretch',
  direction: 'row',
  gap: 8,
  justifyContent: 'flex-start',
  wrap: 'nowrap',
}

export const DEFAULT_ITEM: FlexboxItemProps = {
  flexGrow: 0,
  flexShrink: 1,
  order: 0,
}

export function generateFlexboxCss(
  container: FlexboxContainerProps,
  items: Array<FlexboxItemProps>,
): { containerCss: string; itemsCss: Array<string> } {
  const containerCss = [
    'display: flex;',
    `flex-direction: ${container.direction};`,
    `justify-content: ${container.justifyContent};`,
    `align-items: ${container.alignItems};`,
    `flex-wrap: ${container.wrap};`,
    `gap: ${Math.max(0, container.gap)}px;`,
  ].join('\n')

  const itemsCss = items.map((item) =>
    [`flex-grow: ${item.flexGrow};`, `flex-shrink: ${item.flexShrink};`, `order: ${item.order};`].join('\n'),
  )

  return { containerCss, itemsCss }
}
