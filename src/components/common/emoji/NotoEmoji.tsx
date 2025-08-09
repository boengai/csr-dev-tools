const EMOJI_MAP: Record<'check' | 'robot', { gif: string; webp: string }> = {
  check: {
    gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2705/512.gif',
    webp: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2705/512.webp',
  },
  robot: {
    gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f916/512.gif',
    webp: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f916/512.webp',
  },
}

export const NotoEmoji = ({ emoji, size }: { emoji: keyof typeof EMOJI_MAP; size: number }) => {
  return (
    <picture style={{ height: size, width: size }}>
      <source srcSet={EMOJI_MAP[emoji].webp} type="image/webp" />
      <img alt={emoji} height={size} src={EMOJI_MAP[emoji].gif} width={size} />
    </picture>
  )
}
