import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { ImagePlus, X, Loader2 } from "lucide-react"
import type { Manhwa, ManhwaInsert, Tag } from "@/types"

interface ManhwaFormProps {
  initialData?: Manhwa
  initialTags?: Tag[]
  onSubmit: (data: ManhwaInsert, tagNames: string[], coverFile: File | null) => Promise<void>
  isLoading: boolean
}

export function ManhwaForm({ initialData, initialTags = [], onSubmit, isLoading }: ManhwaFormProps) {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState<Omit<ManhwaInsert, 'user_id'>>({
    title: initialData?.title || "",
    alternative_title: initialData?.alternative_title || "",
    type: initialData?.type || "Manhwa",
    status: initialData?.status || "Reading",
    current_chapter: initialData?.current_chapter || 0,
    total_chapters: initialData?.total_chapters || 0,
    cover_url: initialData?.cover_url || "",
    description: initialData?.description || "",
    rating: initialData?.rating || 0,
    notes: initialData?.notes || "",
    is_favorite: initialData?.is_favorite || false,
  })

  const [tagsString, setTagsString] = useState(initialTags.map(t => t.name).join(", "))
  
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(initialData?.cover_url || null)
  const [isDragging, setIsDragging] = useState(false)

  const processFile = (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Cover image must be smaller than 5 MB.")
      return
    }

    setError(null)
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const clearCover = () => {
    setCoverFile(null)
    setCoverPreview(null)
    setFormData(prev => ({ ...prev, cover_url: "" }))
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value ? Number(value) : 0 }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!formData.title.trim()) return setError("Title is required.")
    if (formData.current_chapter < 0) return setError("Current chapter cannot be negative.")
    if (formData.total_chapters && formData.total_chapters < 0) return setError("Total chapters cannot be negative.")
    if (formData.rating && (formData.rating < 0 || formData.rating > 10)) return setError("Rating must be between 0 and 10.")

    try {
      const submitData: any = { ...formData }
      if (!submitData.total_chapters) submitData.total_chapters = null
      if (!submitData.rating) submitData.rating = null
      
      const parsedTags = tagsString
        .split(",")
        .map(t => t.trim())
        .filter(t => t.length > 0)
        
      await onSubmit(submitData as ManhwaInsert, parsedTags, coverFile)
    } catch (err: any) {
      setError(err.message || "An error occurred while saving.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto flex flex-col gap-12">
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 text-sm flex items-center justify-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Cover & Quick Actions */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Cover Artwork</span>
            
            {coverPreview ? (
              <div className="relative w-full aspect-[3/4.2] bg-surface-elevated border border-border group overflow-hidden">
                <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <button
                  type="button"
                  className="absolute top-4 right-4 bg-background/80 backdrop-blur-md w-8 h-8 flex items-center justify-center text-foreground hover:text-destructive transition-colors border border-border"
                  onClick={clearCover}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                htmlFor="cover-upload" 
                className={`flex flex-col items-center justify-center w-full aspect-[3/4.2] border border-dashed transition-colors cursor-pointer ${isDragging ? 'border-accent bg-accent/5 text-accent' : 'border-border bg-surface hover:bg-surface-elevated text-muted-foreground'}`}
              >
                <ImagePlus size={32} className="mb-4 opacity-50" />
                <span className="text-xs font-sans uppercase tracking-widest font-semibold">Upload Cover</span>
                <span className="text-[10px] mt-2 opacity-50">Drag & Drop or Click</span>
                <input id="cover-upload" type="file" ref={fileInputRef} accept="image/jpeg, image/png, image/webp, image/gif" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>
          
          <label className="flex items-center gap-3 cursor-pointer group mt-4 border border-border bg-surface p-4 hover:bg-surface-elevated transition-colors">
            <input 
              type="checkbox" 
              name="is_favorite" 
              checked={formData.is_favorite} 
              onChange={handleCheckboxChange} 
              className="w-4 h-4 accent-accent"
            />
            <span className="text-xs uppercase tracking-widest font-semibold group-hover:text-accent transition-colors">Add to Favorites</span>
          </label>
        </div>

        {/* Right Column: Details */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="space-y-2">
            <label htmlFor="title" className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Primary Title *</label>
            <input 
              id="title" name="title" value={formData.title} onChange={handleChange} required 
              className="w-full bg-transparent border-b border-border py-3 text-2xl font-serif focus:outline-none focus:border-accent transition-colors placeholder:text-muted-foreground/30"
              placeholder="e.g. Solo Leveling"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="alternative_title" className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Alternative Title</label>
            <input 
              id="alternative_title" name="alternative_title" value={formData.alternative_title || ''} onChange={handleChange} 
              className="w-full bg-surface-elevated border border-border px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
              placeholder="Korean, Japanese, or alternative English title"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label htmlFor="type" className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Format</label>
              <select id="type" name="type" value={formData.type || ''} onChange={handleChange} className="w-full bg-surface-elevated border border-border px-4 py-3 text-sm focus:outline-none focus:border-accent">
                <option value="Manhwa">Manhwa</option>
                <option value="Manga">Manga</option>
                <option value="Manhua">Manhua</option>
                <option value="Webtoon">Webtoon</option>
                <option value="Novel">Novel</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Status</label>
              <select id="status" name="status" value={formData.status} onChange={handleChange} className="w-full bg-surface-elevated border border-border px-4 py-3 text-sm focus:outline-none focus:border-accent">
                <option value="Reading">Reading</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
                <option value="Dropped">Dropped</option>
                <option value="Plan to Read">Plan to Read</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="current_chapter" className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Current Ch. *</label>
              <input id="current_chapter" name="current_chapter" type="number" min="0" value={formData.current_chapter} onChange={handleChange} required className="w-full bg-surface-elevated border border-border px-4 py-3 text-sm focus:outline-none focus:border-accent" />
            </div>

            <div className="space-y-2">
              <label htmlFor="total_chapters" className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Total Ch.</label>
              <input id="total_chapters" name="total_chapters" type="number" min="0" value={formData.total_chapters || ''} onChange={handleChange} placeholder="?" className="w-full bg-surface-elevated border border-border px-4 py-3 text-sm focus:outline-none focus:border-accent" />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="tags" className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Tags (Comma Separated)</label>
            <input 
              id="tags" value={tagsString} onChange={(e) => setTagsString(e.target.value)} 
              placeholder="Action, Fantasy, System, Overpowered" 
              className="w-full bg-surface-elevated border border-border px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Synopsis</label>
            <textarea 
              id="description" name="description" value={formData.description || ''} onChange={handleChange} rows={5} 
              className="w-full bg-surface-elevated border border-border px-4 py-4 text-sm focus:outline-none focus:border-accent transition-colors font-serif resize-none"
              placeholder="Enter the official synopsis or your own summary..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Personal Notes</label>
            <textarea 
              id="notes" name="notes" value={formData.notes || ''} onChange={handleChange} rows={3} 
              className="w-full bg-surface-elevated border border-border px-4 py-4 text-sm focus:outline-none focus:border-accent transition-colors font-serif resize-none"
              placeholder="Thoughts, specific details to remember..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border mt-4">
            <button 
              type="button" 
              onClick={() => navigate(-1)} 
              disabled={isLoading}
              className="w-full bg-transparent border border-border text-foreground hover:bg-surface-elevated transition-colors py-4 text-xs font-semibold uppercase tracking-widest"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-accent text-background hover:bg-accent/90 transition-colors py-4 text-xs font-semibold uppercase tracking-widest flex justify-center items-center"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Save Archive Entry"}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
