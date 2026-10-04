import React, { useRef, useState, useCallback } from "react"

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

export function TiltCard({ children, className = "", ...props }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<React.CSSProperties>({})

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Calculate rotation (-3 to 3 degrees max as requested in spec)
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * -4 // invert Y
    const rotateY = ((x - centerX) / centerX) * 4
    
    // Calculate shine position
    const shineX = (x / rect.width) * 100
    const shineY = (y / rect.height) * 100

    setStyle({
      "--tilt-x": `${rotateX}deg`,
      "--tilt-y": `${rotateY}deg`,
      "--shine-x": `${shineX}%`,
      "--shine-y": `${shineY}%`
    } as React.CSSProperties)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setStyle({
      "--tilt-x": "0deg",
      "--tilt-y": "0deg",
      "--shine-x": "50%",
      "--shine-y": "50%",
      transition: "transform 0.5s ease-out, --tilt-x 0.5s ease-out, --tilt-y 0.5s ease-out"
    } as React.CSSProperties)
    // Remove the transition after it finishes so it doesn't lag mouse movement
    setTimeout(() => setStyle({
      "--tilt-x": "0deg",
      "--tilt-y": "0deg",
      "--shine-x": "50%",
      "--shine-y": "50%"
    } as React.CSSProperties), 500)
  }, [])

  return (
    <div
      ref={cardRef}
      className={`tilt-card ${className}`}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  )
}
