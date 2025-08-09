import { motion } from 'motion/react'
import { useMemo } from 'react'

import type { StarAnimate } from '@/types'

export const TwinkleStarsAnimate = () => {
  const stars: Array<StarAnimate> = useMemo(() => {
    const starCount: number = Math.floor(Math.random() * 20) + 12 // random number 12 to 31
    return Array.from({ length: starCount }, (_: unknown, i: number) => ({
      delay: Math.random() * 2, // Random delay (0-2s)
      duration: Math.random() * 2 + 1, // Random duration (1-3s)
      id: i,
      size: Math.random() * 3 + 1, // Random size (1-4px)
      x: Math.random() * 100, // Random x position (0-100%)
      y: Math.random() * 90, // Random y position (0-90%)
    }))
  }, [])

  return (
    <section className="fixed left-0 top-0 z-0 h-[90dvh] w-full overflow-hidden">
      {stars.map((star: StarAnimate) => (
        <motion.div
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          className="absolute rounded-full bg-white"
          initial={{ opacity: 0, scale: 0 }}
          key={star.id}
          style={{
            height: `${star.size}px`,
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
          }}
          transition={{
            delay: star.delay,
            duration: star.duration,
            ease: 'easeInOut',
            repeat: Infinity,
          }}
        />
      ))}
    </section>
  )
}
