import { supabase } from '@/lib/supabase'
import type { Tag, ManhwaTag } from '@/types'

export const tagService = {
  async getTags(userId: string): Promise<Tag[]> {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId)
      .order('name')

    if (error) {
      throw new Error(error.message)
    }

    return data || []
  },

  async createTag(userId: string, name: string): Promise<Tag> {
    const { data, error } = await supabase
      .from('tags')
      .insert([{ user_id: userId, name }])
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  },

  async getManhwaTags(_userId: string): Promise<{ manhwa_id: string, tags: Tag[] }[]> {
    // We need to get all manhwa_tags and their associated tags for this user
    // A simple way is to join manhwa_tags with tags.
    const { data, error } = await supabase
      .from('manhwa_tags')
      .select(`
        manhwa_id,
        tags:tag_id (
          id,
          name
        )
      `)
    
    if (error) {
      throw new Error(error.message)
    }

    // Process the data to group tags by manhwa_id
    const grouped = new Map<string, Tag[]>()
    
    for (const row of data || []) {
      const tag = Array.isArray(row.tags) ? row.tags[0] : row.tags
      if (!tag) continue
      
      const existing = grouped.get(row.manhwa_id) || []
      existing.push(tag as Tag)
      grouped.set(row.manhwa_id, existing)
    }

    return Array.from(grouped.entries()).map(([manhwa_id, tags]) => ({
      manhwa_id,
      tags
    }))
  },

  async updateManhwaTags(manhwaId: string, tagIds: string[]): Promise<void> {
    // 1. Delete existing tags for this manhwa
    const { error: deleteError } = await supabase
      .from('manhwa_tags')
      .delete()
      .eq('manhwa_id', manhwaId)

    if (deleteError) {
      throw new Error(deleteError.message)
    }

    if (tagIds.length === 0) return

    // 2. Insert new tags
    const newTags: ManhwaTag[] = tagIds.map(tag_id => ({
      manhwa_id: manhwaId,
      tag_id
    }))

    const { error: insertError } = await supabase
      .from('manhwa_tags')
      .insert(newTags)

    if (insertError) {
      throw new Error(insertError.message)
    }
  }
}
