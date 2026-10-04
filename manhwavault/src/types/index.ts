export type ManhwaStatus = "reading" | "completed" | "on_hold" | "dropped" | "plan_to_read"

export const STATUS_MAPPING: Record<ManhwaStatus, string> = {
  reading: "Reading",
  completed: "Completed",
  on_hold: "On Hold",
  dropped: "Dropped",
  plan_to_read: "Plan to Read"
}

export type ManhwaType = "manhwa" | "manhua" | "manga" | "webtoon"

export const TYPE_MAPPING: Record<ManhwaType, string> = {
  manhwa: "Manhwa",
  manhua: "Manhua",
  manga: "Manga",
  webtoon: "Webtoon"
}

export type Manhwa = {
  id: string
  user_id: string
  title: string
  alternative_title?: string | null
  type?: ManhwaType | null
  status: ManhwaStatus
  current_chapter: number
  total_chapters?: number | null
  cover_url?: string | null
  description?: string | null
  rating?: number | null
  notes?: string | null
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export type ManhwaInsert = Omit<Manhwa, 'id' | 'created_at' | 'updated_at'>
export type ManhwaUpdate = Partial<ManhwaInsert>

export type ReadingHistory = {
  id: string
  user_id: string
  manhwa_id: string
  previous_chapter: number
  new_chapter: number
  created_at: string
}

export type ReadingHistoryInsert = Omit<ReadingHistory, 'id' | 'created_at'>

export type Tag = {
  id: string
  user_id: string
  name: string
  created_at: string
}

export type ManhwaTag = {
  manhwa_id: string
  tag_id: string
}
