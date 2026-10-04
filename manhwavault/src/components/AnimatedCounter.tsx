import { useState, useEffect } from "react"

interface AnimatedCounterProps {
  value: number
  duration?: number
}

export function AnimatedCounter({ value, duration = 800 }: AnimatedCounterProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTimestamp: number | null = null
    const startValue = count
    const endValue = value

    if (startValue === endValue) return

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      
      setCount(Math.floor(startValue + (endValue - startValue) * easeProgress))
      
      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        setCount(endValue)
      }
    }
    
    requestAnimationFrame(step)
  }, [value, duration])

  return <span>{count}</span>
}
