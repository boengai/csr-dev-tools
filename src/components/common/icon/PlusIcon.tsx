export const PlusIcon = ({ size }: { size?: number }) => {
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
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
