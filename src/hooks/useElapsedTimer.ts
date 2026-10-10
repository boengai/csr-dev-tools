import { useEffect, useState } from 'react'

const TICK_MS = 100

export const useElapsedTimer = (isRunning: boolean): number => {
  const [elapsed, setElapsed] = useState(0)

  // Reset on every isRunning flip, during render (React's "adjust state when a
  // prop changes" pattern) so a new run never shows the previous run's value.
  const [prevRunning, setPrevRunning] = useState(isRunning)
  if (prevRunning !== isRunning) {
    setPrevRunning(isRunning)
    setElapsed(0)
  }

  useEffect(() => {
    if (!isRunning) return
    const start = performance.now()
    const id = setInterval(() => {
      setElapsed((performance.now() - start) / 1000)
    }, TICK_MS)
    return () => clearInterval(id)
  }, [isRunning])

  return isRunning ? elapsed : 0
}
