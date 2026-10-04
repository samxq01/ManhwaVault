import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Minus, Plus, Check, Keyboard } from "lucide-react"
import { manhwaService } from "@/services/manhwaService"
import { historyService } from "@/services/historyService"
import { useToast } from "@/contexts/ToastContext"
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
  const [animateDirection, setAnimateDirection] = useState<'up' | 'down' | null>(null)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  
  useEffect(() => {
    setLocalChapter(manhwa.current_chapter)
  }, [manhwa.current_chapter])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    // Global keyboard shortcuts for non-compact hero controllers
    if (compact || isEditing) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === "ArrowUp") {
        e.preventDefault();
        handleIncrement();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handleDecrement();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [compact, isEditing, localChapter, isUpdating]);

  const saveChapter = async (newChapter: number, isUndo = false) => {
    if (newChapter < 0) return
    if (newChapter === localChapter) return

    const previousChapter = localChapter
    
    // Animation
    setAnimateDirection(newChapter > previousChapter ? 'up' : 'down')
    setTimeout(() => setAnimateDirection(null), 300)
    
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

      if (onUpdateSuccess && !isUndo) {
        onUpdateSuccess(newChapter)
      }

      if (!isUndo && !compact) {
        toast("Progress Saved", `Updated to Chapter ${newChapter}`, {
          label: "Undo",
          onClick: () => {
            saveChapter(previousChapter, true);
            toast("Undo Successful", `Reverted to Chapter ${previousChapter}`);
          }
        });
      }

    } catch (err: any) {
      // Rollback
      setLocalChapter(previousChapter)
      setAnimateDirection(previousChapter > newChapter ? 'up' : 'down')
      setTimeout(() => setAnimateDirection(null), 300)
      
      toast("Update Failed", "Couldn't save your progress. Try again.")
      if (onError) onError(err.message || "Failed to update chapter")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleIncrement = (e?: React.MouseEvent | Event) => {
    e?.preventDefault()
    e?.stopPropagation()
    saveChapter(localChapter + 1)
  }

  const handleDecrement = (e?: React.MouseEvent | Event) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (localChapter > 0) saveChapter(localChapter - 1)
  }

  const handleEditSubmit = (e?: React.FormEvent | React.KeyboardEvent | React.FocusEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    const parsed = parseInt(editValue, 10)
    if (!isNaN(parsed) && parsed >= 0) {
      saveChapter(parsed)
    } else {
      setEditValue(localChapter.toString())
    }
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
        className="flex items-center gap-1 min-w-[96px]"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={handleDecrement}
          disabled={localChapter <= 0 || isUpdating}
          className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-full bg-surface-elevated border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors disabled:opacity-50 touch-manipulation"
        >
          <Minus size={16} />
        </button>
        <div className="relative w-10 h-10 md:w-11 md:h-11">
          <button 
            onClick={handleIncrement}
            disabled={isUpdating}
            className={`absolute inset-0 flex items-center justify-center rounded-full transition-all duration-300 touch-manipulation ${successPing ? 'bg-accent text-background scale-110 shadow-lg border-accent' : 'bg-surface-elevated border border-border text-foreground hover:bg-accent hover:text-background hover:border-accent'}`}
          >
            {successPing ? <Check size={16} /> : <Plus size={18} />}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div 
        className="flex items-center gap-4 bg-surface p-2 rounded-md border border-border w-max"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          aria-label="Decrease chapter"
          onClick={handleDecrement}
          disabled={localChapter <= 0 || isUpdating}
          className="w-12 h-12 flex items-center justify-center rounded-sm bg-surface-elevated border border-border text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 touch-manipulation"
        >
          <Minus size={18} />
        </button>
        
        <div className="flex flex-col items-center justify-center min-w-[80px]">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Chapter</span>
          {isEditing ? (
            <Input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value.replace(/[^0-9]/g, ''))}
              onKeyDown={handleEditKeyDown}
              onBlur={handleEditSubmit}
              className="w-20 text-center h-8 font-serif text-3xl p-0 bg-transparent border-none text-foreground focus-visible:ring-1 focus-visible:ring-accent"
            />
          ) : (
            <div 
              className="relative flex items-center justify-center cursor-text overflow-hidden h-9 w-20 group"
              onClick={(e) => {
                e.stopPropagation()
                setEditValue(localChapter.toString())
                setIsEditing(true)
              }}
            >
              <strong 
                key={localChapter} 
                className={`font-serif text-3xl md:text-4xl tracking-tighter select-none transition-colors group-hover:text-accent absolute ${
                  animateDirection === 'up' ? 'animate-in slide-in-from-bottom-full fade-in' : 
                  animateDirection === 'down' ? 'animate-in slide-in-from-top-full fade-in' : ''
                }`}
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
          className={`w-12 h-12 flex items-center justify-center rounded-sm transition-all duration-300 touch-manipulation ${
            successPing 
              ? 'bg-accent text-background scale-105 shadow-md border-accent' 
              : 'bg-surface-elevated border border-border text-foreground hover:bg-accent hover:text-background hover:border-accent shadow-sm'
          }`}
        >
          {successPing ? <Check size={20} /> : <Plus size={20} />}
        </button>
      </div>
      
      {!isEditing && (
        <div className="hidden md:flex items-center gap-2 text-[10px] text-muted-foreground/50 uppercase tracking-widest font-sans ml-1 mt-1">
          <Keyboard size={12} />
          <span>Use ↑ and ↓ to quick update</span>
        </div>
      )}
    </div>
  )
}
