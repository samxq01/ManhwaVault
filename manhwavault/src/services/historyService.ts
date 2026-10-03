import { supabase } from '@/lib/supabase'
import type { ReadingHistory, ReadingHistoryInsert } from '@/types'

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
}
