import { useState } from 'react'
import { ImageIcon } from 'lucide-react'

interface CoverImageProps {
  src?: string | null
  alt: string
  className?: string
}

export function CoverImage({ src, alt, className = "w-full h-full object-cover" }: CoverImageProps) {
  const [error, setError] = useState(false)

  if (!src || error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/50 text-muted-foreground p-2 text-center overflow-hidden">
        <ImageIcon className="w-6 h-6 mb-2 opacity-50" />
        <div className="font-bold text-[10px] tracking-widest text-primary/50 mb-1">MANHWAVAULT</div>
        <div className="text-[10px]">No Cover</div>
      </div>
    )
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} 
      onError={() => setError(true)}
    />
  )
}
