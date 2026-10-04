import { supabase } from '@/lib/supabase'

export interface ReadingStatistics {
  total_titles: number
  currently_reading: number
  completed: number
  chapters_read: number
  todays_chapters: number
  weekly_chapters: number
  monthly_chapters: number
}

export const statisticsService = {
  async getReadingStatistics(userId: string): Promise<ReadingStatistics> {
    // If an RPC function 'get_reading_statistics' existed, we would use:
    // const { data, error } = await supabase.rpc('get_reading_statistics')
    // Since we don't have the RPC created on the database yet, we will execute concurrent count queries.

    const now = new Date()
    
    // Today boundary
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // Week boundary (assuming Monday start, or Sunday start depending on locale. We'll use standard JS getDay)
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
    const startOfWeek = new Date(now.setDate(diff))
    startOfWeek.setHours(0, 0, 0, 0)
    
    // Month boundary
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

    // Execute concurrent optimized count queries
    const [
      totalTitles,
      currentlyReading,
      completed,
      chaptersRead,
      todaysChapters,
      weeklyChapters,
      monthlyChapters
    ] = await Promise.all([
      // 1. Total Titles
      supabase
        .from('manhwa')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      
      // 2. Currently Reading
      supabase
        .from('manhwa')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'reading'),
        
      // 3. Completed
      supabase
        .from('manhwa')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed'),
        
      // 4. Chapters Read (Total history records)
      supabase
        .from('reading_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
        
      // 5. Today's Chapters
      supabase
        .from('reading_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfToday.toISOString()),
        
      // 6. Weekly Chapters
      supabase
        .from('reading_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfWeek.toISOString()),
        
      // 7. Monthly Chapters
      supabase
        .from('reading_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString()),
    ])

    // Check for critical errors (e.g., network failure)
    if (totalTitles.error) throw totalTitles.error

    return {
      total_titles: totalTitles.count || 0,
      currently_reading: currentlyReading.count || 0,
      completed: completed.count || 0,
      chapters_read: chaptersRead.count || 0,
      todays_chapters: todaysChapters.count || 0,
      weekly_chapters: weeklyChapters.count || 0,
      monthly_chapters: monthlyChapters.count || 0,
    }
  }
}
