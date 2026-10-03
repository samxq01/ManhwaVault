import { supabase } from '@/lib/supabase'

export const BUCKET_NAME = 'manhwa-covers'
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export const storageService = {
  validateCoverFile(file: File): string | null {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return 'Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Cover image must be smaller than 5 MB.'
    }
    return null
  },

  async uploadManhwaCover(file: File, userId: string, manhwaId: string): Promise<string> {
    const errorMsg = this.validateCoverFile(file)
    if (errorMsg) throw new Error(errorMsg)

    // Determine extension from mime type rather than filename to be safer
    const ext = file.type.split('/')[1]
    const fileName = `cover-${Date.now()}.${ext}`
    const path = `${userId}/${manhwaId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false // we use unique names to avoid caching issues on replace
      })

    if (uploadError) {
      throw new Error(`Cover upload failed: ${uploadError.message}`)
    }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path)
    return data.publicUrl
  },

  async deleteManhwaCoverByUrl(url: string | null | undefined): Promise<void> {
    if (!url) return
    
    // Extract the path from the public URL
    // URL format: https://[project].supabase.co/storage/v1/object/public/manhwa-covers/[userId]/[manhwaId]/[fileName]
    try {
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split(`/public/${BUCKET_NAME}/`)
      if (pathParts.length !== 2) return // Not a valid supabase storage URL for this bucket

      const storagePath = pathParts[1]
      if (!storagePath) return

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([storagePath])

      if (error) {
        console.error('Failed to clean up old cover from storage:', error)
      }
    } catch (e) {
      console.error('Invalid URL when trying to delete cover:', e)
    }
  },

  async deleteAllManhwaCovers(userId: string, manhwaId: string): Promise<void> {
    try {
      const folderPath = `${userId}/${manhwaId}`
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(folderPath)

      if (error) throw error

      if (data && data.length > 0) {
        const filesToRemove = data.map((file) => `${folderPath}/${file.name}`)
        const { error: deleteError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove(filesToRemove)
          
        if (deleteError) throw deleteError
      }
    } catch (e) {
      console.error('Failed to delete all manhwa covers:', e)
    }
  }
}
