import { supabase } from "@/integrations/supabase/client";
import { BulletPoint } from "@/types/bullet";
import { toast } from "sonner";

export const fetchBulletsForUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('bullets')
    .select('*')
    .eq('user_id', userId)
    .order('position');
  
  if (error) {
    console.error('Error loading bullets:', error);
    toast.error("Failed to load bullets");
    return null;
  }
  
  return data;
};

export const createInitialBullet = (userId: string): BulletPoint => ({
  id: generateBulletId(),
  content: "",
  children: [],
  isCollapsed: false,
  position: 0,
  level: 0,
  user_id: userId
});