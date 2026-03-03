import type { ButtonHTMLAttributes } from 'react'

export const CloseButton = ({ onClick }: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>) => {
  return (
    <button className="text-xs text-gray-400 hover:text-white" onClick={onClick} type="button">
      Close
    </button>
  )
}
