import { supabase } from '@/lib/supabase'

export type BackupData = {
  version: number
  exported_at: string
  manhwa: any[]
  tags: any[]
  manhwa_tags: any[]
  reading_history: any[]
  user_settings: any[]
}

export const backupService = {
  async exportData(userId: string): Promise<BackupData> {
    const backup: BackupData = {
      version: 1,
      exported_at: new Date().toISOString(),
      manhwa: [],
      tags: [],
      manhwa_tags: [],
      reading_history: [],
      user_settings: []
    }

    // 1. Fetch Manhwa
    const { data: manhwa } = await supabase.from('manhwa').select('*').eq('user_id', userId)
    if (manhwa) backup.manhwa = manhwa

    // 2. Fetch Tags
    const { data: tags } = await supabase.from('tags').select('*').eq('user_id', userId)
    if (tags) backup.tags = tags

    // 3. Fetch Manhwa_Tags (requires fetching by manhwa_id since user_id might not be on manhwa_tags table directly, but let's try getting all for the user's manhwa)
    if (manhwa && manhwa.length > 0) {
      const manhwaIds = manhwa.map(m => m.id)
      const { data: manhwaTags } = await supabase.from('manhwa_tags').select('*').in('manhwa_id', manhwaIds)
      if (manhwaTags) backup.manhwa_tags = manhwaTags
    }

    // 4. Fetch Reading History
    const { data: history } = await supabase.from('reading_history').select('*').eq('user_id', userId)
    if (history) backup.reading_history = history

    // 5. Fetch User Settings (if exists)
    try {
      const { data: settings } = await supabase.from('user_settings').select('*').eq('user_id', userId)
      if (settings) backup.user_settings = settings
    } catch (e) {
      console.warn("user_settings table might not exist", e)
    }

    return backup
  },

  async importData(userId: string, data: BackupData, mode: 'replace' | 'merge'): Promise<void> {
    if (mode === 'replace') {
      // Delete existing data to replace entirely
      // Order matters due to potential foreign keys: history, manhwa_tags -> manhwa, tags
      await supabase.from('reading_history').delete().eq('user_id', userId)
      
      // Delete manhwa_tags: this is tricky since it might not have user_id. 
      // We'll delete manhwa which should cascade delete manhwa_tags and reading_history theoretically, 
      // but let's explicitly delete what we can.
      const { data: existingManhwa } = await supabase.from('manhwa').select('id').eq('user_id', userId)
      if (existingManhwa && existingManhwa.length > 0) {
        const ids = existingManhwa.map(m => m.id)
        await supabase.from('manhwa_tags').delete().in('manhwa_id', ids)
      }
      
      await supabase.from('tags').delete().eq('user_id', userId)
      await supabase.from('manhwa').delete().eq('user_id', userId)
    }

    // Helper to safely upsert
    const safeUpsert = async (table: string, rows: any[]) => {
      if (!rows || rows.length === 0) return
      // Ensure user_id is set correctly for security
      const sanitizedRows = rows.map(r => ({ ...r, user_id: userId }))
      const { error } = await supabase.from(table).upsert(sanitizedRows)
      if (error) console.error(`Error upserting ${table}:`, error.message)
    }

    // For manhwa_tags, we don't force user_id if it's not a column
    const safeUpsertManhwaTags = async (rows: any[]) => {
      if (!rows || rows.length === 0) return
      const { error } = await supabase.from('manhwa_tags').upsert(rows)
      if (error) console.error(`Error upserting manhwa_tags:`, error.message)
    }

    // Insert in order: manhwa, tags, manhwa_tags, reading_history
    await safeUpsert('manhwa', data.manhwa)
    await safeUpsert('tags', data.tags)
    await safeUpsertManhwaTags(data.manhwa_tags)
    await safeUpsert('reading_history', data.reading_history)
    
    if (data.user_settings && data.user_settings.length > 0) {
      await safeUpsert('user_settings', data.user_settings)
    }
  },

  async exportCsv(userId: string): Promise<string> {
    const { data: manhwa } = await supabase.from('manhwa').select('*').eq('user_id', userId)
    if (!manhwa || manhwa.length === 0) return ""

    const headers = ['Title', 'Type', 'Status', 'Current Chapter', 'Total Chapters', 'Rating', 'Created', 'Updated']
    
    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return ''
      const stringified = String(str)
      if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n')) {
        return `"${stringified.replace(/"/g, '""')}"`
      }
      return stringified
    }

    const rows = manhwa.map(m => [
      escapeCsv(m.title),
      escapeCsv(m.type),
      escapeCsv(m.status),
      escapeCsv(m.current_chapter),
      escapeCsv(m.total_chapters),
      escapeCsv(m.rating),
      escapeCsv(m.created_at),
      escapeCsv(m.updated_at)
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    return csvContent
  },
  
  async getLastBackupDate(userId: string): Promise<string | null> {
    try {
      // Let's store/retrieve it in localStorage as a fallback, or user_settings
      const { data } = await supabase.from('user_settings').select('last_backup_date').eq('user_id', userId).single()
      if (data && data.last_backup_date) return data.last_backup_date
    } catch {
      // Fallback
    }
    return localStorage.getItem(`last_backup_${userId}`)
  },
  
  async updateLastBackupDate(userId: string, date: string): Promise<void> {
    try {
      const { error } = await supabase.from('user_settings').upsert({ user_id: userId, last_backup_date: date })
      if (!error) return
    } catch {
      // Ignore
    }
    localStorage.setItem(`last_backup_${userId}`, date)
  }
}
