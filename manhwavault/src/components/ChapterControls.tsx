import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Minus, Plus, Check } from "lucide-react"
import { manhwaService } from "@/services/manhwaService"
import { historyService } from "@/services/historyService"
import type { Manhwa } from "@/types"

interface ChapterControlsProps {
  manhwa: Manhwa
  userId: string
  onUpdateSuccess?: (newChapter: number) => void
  onError?: (error: string) => void
  compact?: boolean
}

export function ChapterControls({ manhwa, userId, onUpdateSuccess, onError, compact = false }: ChapterControlsProps) {
  const [localChapter, setLocalChapter] = useState(manhwa.current_chapter)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(manhwa.current_chapter.toString())
  const [isUpdating, setIsUpdating] = useState(false)
  const [successPing, setSuccessPing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    setLocalChapter(manhwa.current_chapter)
  }, [manhwa.current_chapter])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const saveChapter = async (newChapter: number) => {
    if (newChapter < 0) return
    if (newChapter === manhwa.current_chapter) return

    const previousChapter = manhwa.current_chapter
    
    // Optimistic UI update
    setLocalChapter(newChapter)
    setIsUpdating(true)
    setSuccessPing(true)
    
    setTimeout(() => setSuccessPing(false), 1000)

    try {
      await manhwaService.updateManhwa(manhwa.id, userId, {
        current_chapter: newChapter
      })
      
      await historyService.addHistoryRecord({
        user_id: userId,
        manhwa_id: manhwa.id,
        previous_chapter: previousChapter,
        new_chapter: newChapter,
      })

      if (onUpdateSuccess) onUpdateSuccess(newChapter)
    } catch (err: any) {
      setLocalChapter(previousChapter)
      if (onError) onError(err.message || "Failed to update chapter")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleIncrement = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    saveChapter(localChapter + 1)
  }

  const handleDecrement = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (localChapter > 0) saveChapter(localChapter - 1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
    if (e.key === "ArrowUp") { e.preventDefault(); e.stopPropagation(); handleIncrement() }
    else if (e.key === "ArrowDown") { e.preventDefault(); e.stopPropagation(); handleDecrement() }
  }

  const handleEditSubmit = (e?: React.FormEvent | React.KeyboardEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    const parsed = parseInt(editValue, 10)
    if (!isNaN(parsed) && parsed >= 0) saveChapter(parsed)
    setIsEditing(false)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === "Enter") handleEditSubmit(e)
    else if (e.key === "Escape") { setIsEditing(false); setEditValue(localChapter.toString()) }
  }

  if (compact) {
    return (
      <div 
        className="flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={handleDecrement}
          disabled={localChapter <= 0}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-elevated border border-border text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <Minus size={14} />
        </button>
        <div className="relative w-8 h-8">
          <button 
            onClick={handleIncrement}
            disabled={isUpdating}
            className={`absolute inset-0 flex items-center justify-center rounded-full transition-all duration-300 ${successPing ? 'bg-accent text-background scale-110 shadow-lg' : 'bg-surface-elevated border border-border text-foreground hover:bg-accent hover:text-background hover:border-accent'}`}
          >
            {successPing ? <Check size={14} /> : <Plus size={16} />}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="flex items-center gap-4 bg-surface p-2 rounded-md border border-border"
      tabIndex={0} 
      onKeyDown={handleKeyDown}
      onClick={(e) => e.stopPropagation()}
    >
      <button 
        aria-label="Decrease chapter"
        onClick={handleDecrement}
        disabled={localChapter <= 0}
        className="w-12 h-12 flex items-center justify-center rounded-sm bg-surface-elevated border border-border text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        <Minus size={18} />
      </button>
      
      <div className="flex flex-col items-center justify-center min-w-[80px]">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Chapter</span>
        {isEditing ? (
          <Input
            ref={inputRef}
            type="number"
            min="0"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleEditKeyDown}
            onBlur={handleEditSubmit}
            className="w-16 text-center h-8 font-serif text-2xl p-0 bg-transparent border-none text-foreground focus-visible:ring-1 focus-visible:ring-accent"
          />
        ) : (
          <div 
            className="relative flex items-center justify-center cursor-text overflow-hidden h-8 w-16 group"
            onClick={(e) => {
              e.stopPropagation()
              setEditValue(localChapter.toString())
              setIsEditing(true)
            }}
          >
            <strong 
              key={localChapter} 
              className="font-serif text-3xl tracking-tighter select-none animate-in slide-in-from-bottom-4 fade-in duration-300 group-hover:text-accent transition-colors"
            >
              {localChapter}
            </strong>
          </div>
        )}
      </div>

      <button 
        aria-label="Increase chapter"
        onClick={handleIncrement}
        disabled={isUpdating}
        className={`w-12 h-12 flex items-center justify-center rounded-sm transition-all duration-300 ${
          successPing 
            ? 'bg-accent text-background scale-105 shadow-md border-accent' 
            : 'bg-surface-elevated border border-border text-foreground hover:bg-accent hover:text-background hover:border-accent shadow-sm'
        }`}
      >
        {successPing ? <Check size={20} /> : <Plus size={20} />}
      </button>
    </div>
  )
}
