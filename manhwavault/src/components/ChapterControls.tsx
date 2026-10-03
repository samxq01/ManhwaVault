import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Minus, Plus } from "lucide-react"
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
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Sync local state if prop changes from outside (e.g. initial load)
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
    
    // 1. Optimistic UI update
    setLocalChapter(newChapter)

    try {
      // 2. Save to Supabase
      await manhwaService.updateManhwa(manhwa.id, userId, {
        current_chapter: newChapter
      })
      
      // 3. Create reading history
      await historyService.addHistoryRecord({
        user_id: userId,
        manhwa_id: manhwa.id,
        previous_chapter: previousChapter,
        new_chapter: newChapter,
      })

      if (onUpdateSuccess) {
        onUpdateSuccess(newChapter)
      }
    } catch (err: any) {
      // 4. Revert optimistic UI on failure and show error
      setLocalChapter(previousChapter)
      if (onError) {
        onError(err.message || "Failed to update chapter")
      }
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
    if (localChapter > 0) {
      saveChapter(localChapter - 1)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent triggering if typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return
    }
    
    if (e.key === "ArrowUp") {
      e.preventDefault()
      e.stopPropagation()
      handleIncrement()
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      e.stopPropagation()
      handleDecrement()
    }
  }

  const handleEditSubmit = (e?: React.FormEvent | React.KeyboardEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    const parsed = parseInt(editValue, 10)
    if (!isNaN(parsed) && parsed >= 0) {
      saveChapter(parsed)
    }
    setIsEditing(false)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === "Enter") {
      handleEditSubmit(e)
    } else if (e.key === "Escape") {
      setIsEditing(false)
      setEditValue(localChapter.toString())
    }
  }

  return (
    <div 
      className={compact ? "flex items-center justify-between w-full" : "flex items-center gap-2 md:gap-3 shrink-0"}
      tabIndex={0} 
      onKeyDown={handleKeyDown}
      onClick={(e) => e.stopPropagation()} // Prevent card clicks
    >
      <Button 
        variant="outline" 
        size="icon"
        onClick={handleDecrement}
        disabled={localChapter <= 0}
        className={compact ? "h-8 w-8 rounded-full shrink-0" : "h-10 w-10 md:h-12 md:w-12 rounded-full shrink-0"}
      >
        <Minus className={compact ? "h-3 w-3" : "h-4 w-4 md:h-5 md:w-5"} />
      </Button>
      
      <div className={compact ? "flex-1 flex justify-center items-center px-1" : "w-12 md:w-16 flex justify-center items-center"}>
        {isEditing ? (
          <Input
            ref={inputRef}
            type="number"
            min="0"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleEditKeyDown}
            onBlur={handleEditSubmit}
            className={compact ? "w-full text-center h-7 text-xs font-bold p-1" : "w-full text-center h-8 font-bold p-1"}
          />
        ) : (
          <div 
            className={`text-center font-bold tabular-nums cursor-text select-none hover:bg-accent/50 rounded p-1 transition-colors ${compact ? 'text-sm w-full' : 'text-lg md:text-2xl w-full'}`}
            onClick={(e) => {
              e.stopPropagation()
              setEditValue(localChapter.toString())
              setIsEditing(true)
            }}
          >
            {localChapter}
          </div>
        )}
      </div>

      <Button 
        variant="default" 
        size="icon"
        onClick={handleIncrement}
        className={compact ? "h-8 w-8 rounded-full shrink-0" : "h-10 w-10 md:h-12 md:w-12 rounded-full shrink-0"}
      >
        <Plus className={compact ? "h-3 w-3" : "h-4 w-4 md:h-5 md:w-5"} />
      </Button>
    </div>
  )
}
