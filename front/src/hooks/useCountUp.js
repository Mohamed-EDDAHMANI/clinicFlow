import { useEffect, useRef, useState } from 'react'

const DURATION_MS = 700

export const useCountUp = (value) => {
  const [shown, setShown] = useState(0)
  const shownRef = useRef(0)

  useEffect(() => {
    if (typeof value !== 'number') return undefined

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const from = shownRef.current
    const start = performance.now()
    let frame

    const step = (now) => {
      const progress = reduceMotion ? 1 : Math.min(1, (now - start) / DURATION_MS)
      const next = Math.round(from + (value - from) * (1 - (1 - progress) ** 3))
      shownRef.current = next
      setShown(next)
      if (progress < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return shown
}
