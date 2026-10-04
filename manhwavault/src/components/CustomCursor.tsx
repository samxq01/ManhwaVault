import { useEffect, useState, useRef } from "react"

export function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [glowPosition, setGlowPosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const [isHoveringCover, setIsHoveringCover] = useState(false)
  const [isHidden, setIsHidden] = useState(true)
  
  const requestRef = useRef<number | undefined>(undefined)
  const previousTimeRef = useRef<number | undefined>(undefined)
  const targetPosition = useRef({ x: 0, y: 0 })
  
  // Disable on mobile/touch devices
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) {
      setIsTouchDevice(true)
      return
    }

    const onMouseMove = (e: MouseEvent) => {
      setIsHidden(false)
      setPosition({ x: e.clientX, y: e.clientY })
      targetPosition.current = { x: e.clientX, y: e.clientY }

      // Check if hovering interactive elements
      const target = e.target as HTMLElement
      const isInteractive = target.closest('button, a, input, select, .interactive, .card-plus, .stat-card, .quick-item')
      const isCover = target.closest('.cover')
      
      setIsHovering(!!isInteractive)
      setIsHoveringCover(!!isCover)
    }

    const onMouseLeave = () => setIsHidden(true)
    const onMouseEnter = () => setIsHidden(false)

    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseleave", onMouseLeave)
    document.addEventListener("mouseenter", onMouseEnter)

    // Animation loop for smooth glow following
    const animate = (time: number) => {
      if (previousTimeRef.current != undefined) {
        setGlowPosition(prev => {
          // Smooth interpolation (lerp)
          const dx = targetPosition.current.x - prev.x
          const dy = targetPosition.current.y - prev.y
          return {
            x: prev.x + dx * 0.15,
            y: prev.y + dy * 0.15
          }
        })
      }
      previousTimeRef.current = time
      requestRef.current = requestAnimationFrame(animate)
    }
    
    requestRef.current = requestAnimationFrame(animate)

    return () => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseleave", onMouseLeave)
      document.removeEventListener("mouseenter", onMouseEnter)
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [])

  if (isTouchDevice || isHidden) return null

  // We use inline styles for the transform to avoid React re-render performance issues.
  // Actually, setting state 60fps might be heavy, but it's acceptable for a small component.
  // A better approach is refs directly manipulating DOM, but let's try state first.

  return (
    <>
      {/* Small dot */}
      <div 
        className={`custom-cursor-dot ${isHovering ? 'hovering' : ''} ${isHoveringCover ? 'hovering-cover' : ''}`}
        style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
      />
      {/* Soft glow following the cursor */}
      <div 
        className={`custom-cursor-glow ${isHovering ? 'hovering' : ''} ${isHoveringCover ? 'hovering-cover' : ''}`}
        style={{ transform: `translate3d(${glowPosition.x}px, ${glowPosition.y}px, 0)` }}
      />
      
      {/* Spotlight Effect - Very large, low opacity gradient */}
      <div 
        className="cursor-spotlight"
        style={{ transform: `translate3d(${glowPosition.x}px, ${glowPosition.y}px, 0)` }}
      />
    </>
  )
}
