import { supabase } from "@/integrations/supabase/client";
import { BulletPoint } from "@/types/bullet";
import { generateBulletId } from "@/utils/idGenerator";
import { toast } from "sonner";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (fn: () => Promise<any>, retries = MAX_RETRIES): Promise<any> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await delay(RETRY_DELAY);
      return fetchWithRetry(fn, retries - 1);
    }
    throw error;
  }
};

export const fetchBulletsForUser = async (userId: string) => {
  try {
    // Check auth state first
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in to access your bullets");
      throw new Error("No active session");
    }

    const fetchBullets = async () => {
      const { data, error } = await supabase
        .from('bullets')
        .select('*')
        .eq('user_id', userId)
        .order('position');

      if (error) throw error;
      return data;
    };

    return await fetchWithRetry(fetchBullets);
  } catch (error: any) {
    console.error('Error fetching bullets:', error);
    
    // Show user-friendly error message
    if (!navigator.onLine) {
      toast.error("You're offline. Please check your internet connection.");
    } else if (error.message?.includes('Failed to fetch')) {
      toast.error("Network error. Retrying...");
    } else {
      toast.error("Error loading bullets. Please try again later.");
    }
    
    throw error;
  }
};

export const createInitialBullet = (userId: string): BulletPoint => {
  return {
    id: generateBulletId(),
    content: "",
    children: [],
    isCollapsed: false,
    position: 0,
    level: 0,
    parent_id: null
  };
};

export const insertBullet = async (bullet: BulletPoint & { user_id: string }) => {
  try {
    const { data, error } = await supabase
      .from('bullets')
      .insert([bullet])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error inserting bullet:', error);
    toast.error("Failed to create bullet. Please try again.");
    throw error;
  }
};

export const updateBulletContent = async (id: string, content: string) => {
  try {
    const { data, error } = await supabase
      .from('bullets')
      .update({ content })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error updating bullet:', error);
    toast.error("Failed to update bullet. Please try again.");
    throw error;
  }
};

export const deleteBulletById = async (id: string) => {
  try {
    const { error } = await supabase
      .from('bullets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error deleting bullet:', error);
    toast.error("Failed to delete bullet. Please try again.");
    throw error;
  }
};