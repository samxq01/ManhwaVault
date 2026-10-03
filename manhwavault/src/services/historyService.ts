import { supabase } from '@/lib/supabase'
import type { ReadingHistory, ReadingHistoryInsert, Manhwa } from '@/types'

export type HistoryWithManhwa = ReadingHistory & { manhwa: Pick<Manhwa, 'title' | 'cover_url'> }

export const historyService = {
  async addHistoryRecord(record: ReadingHistoryInsert): Promise<ReadingHistory> {
    const { data, error } = await supabase
      .from('reading_history')
      .insert([record])
      .select()
      .single()

    if (error) {
      console.error('Failed to add reading history:', error.message)
      throw new Error(error.message)
    }

    return data
  },

  async getHistory(userId: string): Promise<HistoryWithManhwa[]> {
    const { data, error } = await supabase
      .from('reading_history')
      .select(`
        *,
        manhwa:manhwa_id (
          title,
          cover_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }
    
    // Typecast to handle the relation
    return (data || []) as unknown as HistoryWithManhwa[]
  },

  async getStats(userId: string) {
    const { data, error } = await supabase
      .from('reading_history')
      .select('previous_chapter, new_chapter, created_at')
      .eq('user_id', userId)

    if (error) {
      throw new Error(error.message)
    }

    return data || []
  }
}
