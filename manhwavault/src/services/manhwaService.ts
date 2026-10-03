import { supabase } from '@/lib/supabase'
import type { Manhwa, ManhwaInsert, ManhwaUpdate } from '@/types'

export const manhwaService = {
  async getManhwa(userId: string): Promise<Manhwa[]> {
    const { data, error } = await supabase
      .from('manhwa')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return data || []
  },

  async getManhwaById(id: string, userId: string): Promise<Manhwa | null> {
    const { data, error } = await supabase
      .from('manhwa')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  },

  async createManhwa(manhwa: ManhwaInsert): Promise<Manhwa> {
    const { data, error } = await supabase
      .from('manhwa')
      .insert([manhwa])
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  },

  async updateManhwa(id: string, userId: string, updates: ManhwaUpdate): Promise<Manhwa> {
    const { data, error } = await supabase
      .from('manhwa')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  },

  async deleteManhwa(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('manhwa')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      throw new Error(error.message)
    }
  }
}
