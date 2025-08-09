const TYPE_LABEL: Record<'jpeg' | 'png' | 'webp', string> = {
  jpeg: 'JPEG',
  png: 'PNG',
  webp: 'WEBP',
}

export const ImageIcon = ({ size, type = 'default' }: { size?: number; type?: 'default' | string }) => {
  const typeLabel: string | undefined = TYPE_LABEL[type as keyof typeof TYPE_LABEL]
  return (
    <svg
      fill="none"
      height={size ?? '1em'}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={size ?? '1em'}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect height="18" rx="2" ry="2" width="18" x="3" y="3" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      {typeLabel && (
        <text fill="currentColor" fontSize="4.5" stroke="none" textAnchor="middle" x="12" y="20">
          {typeLabel}
        </text>
      )}
    </svg>
  )
}
