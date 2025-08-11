import { motion } from 'motion/react'

import type { DataCellTableProps } from '@/types'

export const DataCellTable = ({ rows }: DataCellTableProps) => {
  return (
    <motion.div
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="table w-full border-spacing-x-1 border-spacing-y-2 overflow-hidden"
      exit={{ opacity: 0, scale: 0.98, y: -10 }}
      initial={{ opacity: 0, scale: 0.95, y: -20 }}
      transition={{
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1], // Custom ease for smooth feel
      }}
    >
      <div className="table-row-group">
        {rows.map((r: DataCellTableProps['rows'][number], idx: number) => (
          <div className="table-row [&>*]:table-cell [&>*]:p-2" key={idx}>
            <div className="bg-secondary/50 font-bold">{r.label}</div>
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className="bg-secondary/30 text-body-sm"
              initial={{ opacity: 0, x: 10 }}
              key={r.value} // Re-animate when this specific time changes
              transition={{
                delay: idx * 0.1, // Slight stagger between UTC and Local
                duration: 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {r.render?.(r.value) ?? r.value}
            </motion.div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
