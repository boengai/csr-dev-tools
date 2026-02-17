export type TextStats = {
  characters: number
  charactersNoSpaces: number
  lines: number
  paragraphs: number
  readingTime: string
  sentences: number
  speakingTime: string
  words: number
}

const formatTime = (minutes: number): string => {
  if (minutes < 1) return '< 1 min'
  const m = Math.ceil(minutes)
  return `${String(m)} min`
}

export const countTextStats = (text: string): TextStats => {
  if (text.length === 0) {
    return {
      characters: 0,
      charactersNoSpaces: 0,
      lines: 0,
      paragraphs: 0,
      readingTime: '0 min',
      sentences: 0,
      speakingTime: '0 min',
      words: 0,
    }
  }

  const characters = text.length
  const charactersNoSpaces = text.replace(/\s/g, '').length
  const words = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length
  const lines = text.split('\n').length

  const readingTime = formatTime(words / 200)
  const speakingTime = formatTime(words / 130)

  return {
    characters,
    charactersNoSpaces,
    lines,
    paragraphs,
    readingTime,
    sentences,
    speakingTime,
    words,
  }
}
