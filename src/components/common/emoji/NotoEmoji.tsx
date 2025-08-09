const EMOJI_MAP: Record<'check' | 'flying-saucer' | 'robot', string> = {
  check: '2705',
  'flying-saucer': '1f6f8',
  robot: '1f916',
}

export const NotoEmoji = ({ emoji, size }: { emoji: keyof typeof EMOJI_MAP; size: number }) => {
  return (
    <picture style={{ height: size, width: size }}>
      <source
        srcSet={`https://fonts.gstatic.com/s/e/notoemoji/latest/${EMOJI_MAP[emoji]}/512.webp`}
        type="image/webp"
      />
      <img
        alt={emoji}
        height={size}
        src={`https://fonts.gstatic.com/s/e/notoemoji/latest/${EMOJI_MAP[emoji]}/512.gif`}
        width={size}
      />
    </picture>
  )
}
