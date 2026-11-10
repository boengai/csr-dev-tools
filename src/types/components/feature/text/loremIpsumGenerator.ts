export type LoremUnit = 'paragraphs' | 'sentences' | 'words'

export type LoremIpsumOptions = {
  count: number
  startWithLorem: boolean
  unit: LoremUnit
}
