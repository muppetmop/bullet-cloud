import { supabase } from "@/integrations/supabase/client";
import { BulletPoint } from "@/types/bullet";
import { generateBulletId } from "@/utils/idGenerator";

export const fetchBulletsForUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('bullets')
    .select('*')
    .eq('user_id', userId)
    .order('position');

  if (error) throw error;
  return data;
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
  const { data, error } = await supabase
    .from('bullets')
    .insert([bullet])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateBulletContent = async (id: string, content: string) => {
  const { data, error } = await supabase
    .from('bullets')
    .update({ content })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteBulletById = async (id: string) => {
  const { error } = await supabase
    .from('bullets')
    .delete()
    .eq('id', id);

  if (error) throw error;
};