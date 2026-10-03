import { useState, useRef, useEffect } from "react"

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
      className={`chapter-control ${compact ? "chapter-compact" : ""}`}
      tabIndex={0} 
      onKeyDown={handleKeyDown}
      onClick={(e) => e.stopPropagation()} // Prevent card clicks
    >
      <button 
        aria-label="Decrease chapter"
        onClick={handleDecrement}
        disabled={localChapter <= 0}
      >
        <Minus size={compact ? 18 : 20} />
      </button>
      
      {!compact && (
        <div>
          <span>Chapter</span>
          {isEditing ? (
            <Input
              ref={inputRef}
              type="number"
              min="0"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleEditKeyDown}
              onBlur={handleEditSubmit}
              className="w-16 text-center h-8 font-bold p-1 bg-transparent border-none text-white focus-visible:ring-1"
              autoFocus
            />
          ) : (
            <strong 
              className="cursor-text select-none"
              onClick={(e) => {
                e.stopPropagation()
                setEditValue(localChapter.toString())
                setIsEditing(true)
              }}
            >
              {localChapter}
            </strong>
          )}
        </div>
      )}

      <button 
        className="increment"
        aria-label="Increase chapter"
        onClick={handleIncrement}
      >
        <Plus size={compact ? 18 : 20} />
      </button>
    </div>
  )
}
