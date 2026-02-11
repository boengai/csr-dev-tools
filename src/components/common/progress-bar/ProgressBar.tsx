import { motion } from 'motion/react'

export const ProgressBar = ({ value }: { value: number }) => {
  const normalizedValue = Math.min(Math.max(value, 0), 100)

  return (
    <div className="flex w-full shrink-0 flex-col gap-2">
      <div className="h-2 w-full rounded-full bg-gray-300">
        <motion.div
          animate={{ width: `${normalizedValue}%` }}
          className="bg-primary h-full rounded-full"
          initial={{ width: `0%` }}
          transition={{
            damping: 25,
            duration: 0.5,
            stiffness: 120,
            type: 'spring',
          }}
        />
      </div>
    </div>
  )
}
