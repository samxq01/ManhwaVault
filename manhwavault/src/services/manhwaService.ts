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
    const {
      data: { user: supabaseUser },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("=== MANHWAVAULT SAVE DEBUG ===");
    console.log("Auth error:", authError);
    console.log("Supabase user ID:", supabaseUser?.id);
    console.log("Payload:", manhwa);
    console.log("Payload user_id:", manhwa.user_id);
    console.log("INSERT user_id:", manhwa.user_id);
    console.log("INSERT user_id type:", typeof manhwa.user_id);
    console.log("Authenticated Supabase user:", supabaseUser?.id);
    console.log("IDs match:", supabaseUser?.id === manhwa.user_id);

    const userId = supabaseUser?.id;

    if (!userId) {
      throw new Error("No authenticated Supabase user");
    }

    const insertPayload = {
      ...manhwa,
      user_id: userId,
    };

    console.log("[ManhwaVault] FINAL MANHWA INSERT PAYLOAD:", insertPayload);
    console.log("[ManhwaVault] FINAL STATUS:", insertPayload.status);
    console.log("[ManhwaVault] STATUS JSON:", JSON.stringify(insertPayload.status));

    const VALID_STATUSES = [
      "reading",
      "completed",
      "plan_to_read",
      "on_hold",
      "dropped",
    ] as const;

    if (!VALID_STATUSES.includes(insertPayload.status as any)) {
      throw new Error(
        `Invalid Manhwa status before database insert: ${String(insertPayload.status)}`
      );
    }

    const { data, error } = await supabase
      .from('manhwa')
      .insert([insertPayload])
      .select()
      .single()

    if (error) {
      console.error("INSERT ERROR:", error);
      throw new Error(error.message)
    }

    return data
  },

  async updateManhwa(id: string, userId: string, updates: ManhwaUpdate): Promise<Manhwa> {
    console.log("[ManhwaVault] FINAL MANHWA UPDATE PAYLOAD:", updates);
    if (updates.status) {
      console.log("[ManhwaVault] FINAL STATUS:", updates.status);
      console.log("[ManhwaVault] STATUS JSON:", JSON.stringify(updates.status));

      const VALID_STATUSES = [
        "reading",
        "completed",
        "plan_to_read",
        "on_hold",
        "dropped",
      ] as const;

      if (!VALID_STATUSES.includes(updates.status as any)) {
        throw new Error(
          `Invalid Manhwa status before database update: ${String(updates.status)}`
        );
      }
    }

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
