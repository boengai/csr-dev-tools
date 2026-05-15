import { useEffect, useState } from 'react'

const TICK_MS = 100

export const useElapsedTimer = (isRunning: boolean): number => {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    setElapsed(0)
    if (!isRunning) return
    const start = performance.now()
    const id = setInterval(() => {
      setElapsed((performance.now() - start) / 1000)
    }, TICK_MS)
    return () => clearInterval(id)
  }, [isRunning])

  return isRunning ? elapsed : 0
}
