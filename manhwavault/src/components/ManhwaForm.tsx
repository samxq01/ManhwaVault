import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import type { Manhwa, ManhwaInsert, Tag } from "@/types"

interface ManhwaFormProps {
  initialData?: Manhwa
  initialTags?: Tag[]
  onSubmit: (data: ManhwaInsert, tagNames: string[]) => Promise<void>
  isLoading: boolean
}

export function ManhwaForm({ initialData, initialTags = [], onSubmit, isLoading }: ManhwaFormProps) {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<Omit<ManhwaInsert, 'user_id'>>({
    title: initialData?.title || "",
    alternative_title: initialData?.alternative_title || "",
    type: initialData?.type || "Manhwa",
    status: initialData?.status || "Reading",
    current_chapter: initialData?.current_chapter || 0,
    total_chapters: initialData?.total_chapters || 0, // Using 0 as empty equivalent for input, handled on submit
    cover_url: initialData?.cover_url || "",
    description: initialData?.description || "",
    rating: initialData?.rating || 0,
    notes: initialData?.notes || "",
    is_favorite: initialData?.is_favorite || false,
  })

  const [tagsString, setTagsString] = useState(initialTags.map(t => t.name).join(", "))

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
    
    // Validation
    if (!formData.title.trim()) {
      return setError("Title is required.")
    }
    if (formData.current_chapter < 0) {
      return setError("Current chapter cannot be negative.")
    }
    if (formData.total_chapters && formData.total_chapters < 0) {
      return setError("Total chapters cannot be negative.")
    }
    if (formData.rating && (formData.rating < 0 || formData.rating > 10)) {
      return setError("Rating must be between 0 and 10.")
    }

    try {
      const submitData: any = { ...formData }
      if (!submitData.total_chapters) submitData.total_chapters = null
      if (!submitData.rating) submitData.rating = null
      
      const parsedTags = tagsString
        .split(",")
        .map(t => t.trim())
        .filter(t => t.length > 0)
        
      await onSubmit(submitData as ManhwaInsert, parsedTags)
    } catch (err: any) {
      setError(err.message || "An error occurred while saving.")
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Title" : "Add New Title"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 bg-destructive/15 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="alternative_title">Alternative Title</Label>
              <Input id="alternative_title" name="alternative_title" value={formData.alternative_title || ''} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select id="type" name="type" value={formData.type || ''} onChange={handleChange}>
                <option value="Manhwa">Manhwa</option>
                <option value="Manga">Manga</option>
                <option value="Manhua">Manhua</option>
                <option value="Webtoon">Webtoon</option>
                <option value="Novel">Novel</option>
                <option value="Other">Other</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" value={formData.status} onChange={handleChange}>
                <option value="Reading">Reading</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
                <option value="Dropped">Dropped</option>
                <option value="Plan to Read">Plan to Read</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_chapter">Current Chapter *</Label>
              <Input id="current_chapter" name="current_chapter" type="number" min="0" value={formData.current_chapter} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_chapters">Total Chapters</Label>
              <Input id="total_chapters" name="total_chapters" type="number" min="0" value={formData.total_chapters || ''} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">Rating (0-10)</Label>
              <Input id="rating" name="rating" type="number" min="0" max="10" step="0.1" value={formData.rating || ''} onChange={handleChange} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cover_url">Cover URL</Label>
              <Input id="cover_url" name="cover_url" type="url" value={formData.cover_url || ''} onChange={handleChange} placeholder="https://..." />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input 
                id="tags" 
                value={tagsString} 
                onChange={(e) => setTagsString(e.target.value)} 
                placeholder="Action, Romance, Murim" 
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={formData.description || ''} onChange={handleChange} rows={3} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Personal Notes</Label>
              <Textarea id="notes" name="notes" value={formData.notes || ''} onChange={handleChange} rows={2} />
            </div>
            
            <div className="flex items-center space-x-2 md:col-span-2 pt-2">
              <input 
                type="checkbox" 
                id="is_favorite" 
                name="is_favorite" 
                checked={formData.is_favorite} 
                onChange={handleCheckboxChange} 
                className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
              />
              <Label htmlFor="is_favorite" className="cursor-pointer">Mark as Favorite</Label>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 border-t p-6">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Title"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
