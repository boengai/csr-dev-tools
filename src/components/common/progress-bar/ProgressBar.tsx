import { motion } from 'motion/react'

export const ProgressBar = ({ value }: { value: number }) => {
  const v: number = value < 0 ? 0 : value > 100 ? 100 : Math.round(value)

  return (
    <div className="flex w-full shrink-0 flex-col gap-2">
      <div className="h-2 w-full rounded-full bg-gray-300">
        <motion.div
          animate={{ width: `${v}%` }}
          className="bg-primary h-full rounded-full"
          initial={{ width: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      </div>
    </div>
  )
}
