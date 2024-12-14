import { useState, useCallback } from 'react';
import { BulletPoint } from '@/types/bullet';
import { generateUbid } from '@/utils/idGenerator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getAllVisibleBullets } from '@/utils/bulletOperations';

export const useCreateBullet = (
  bullets: BulletPoint[],
  setBullets: React.Dispatch<React.SetStateAction<BulletPoint[]>>
) => {
  const createNewBullet = useCallback(async (id: string): Promise<string | null> => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      toast.error('Please log in to create bullets');
      return null;
    }

    const allBullets = getAllVisibleBullets(bullets);
    const currentIndex = allBullets.findIndex(b => b.id === id);
    const newAbsolutePosition = currentIndex + 1;
    
    // When creating a new bullet with Enter, level_position should match absolute_position
    // This will be changed later if the bullet is indented
    const newLevelPosition = newAbsolutePosition;

    // Shift all bullets after the new position
    const updatePromises = allBullets.slice(currentIndex + 1).map((b, index) => {
      return supabase
        .from('bullets')
        .update({ absolute_position: newAbsolutePosition + index + 1 })
        .eq('id', b.id);
    });

    const newBullet = {
      id: generateUbid(),
      content: "",
      children: [],
      isCollapsed: false,
      absolutePosition: newAbsolutePosition,
      levelPosition: newLevelPosition
    };

    try {
      // Update positions of existing bullets
      await Promise.all(updatePromises);

      // Create the new bullet
      const { error } = await supabase
        .from('bullets')
        .insert([{
          id: newBullet.id,
          content: newBullet.content,
          absolute_position: newAbsolutePosition,
          level_position: newLevelPosition,
          is_collapsed: false,
          user_id: session.session.user.id
        }]);

      if (error) {
        console.error('Error creating new bullet:', error);
        toast.error('Failed to create new bullet');
        return null;
      }

      // Update local state
      const updatedBullets = [...bullets];
      const parentIndex = bullets.findIndex(b => b.id === id);
      if (parentIndex !== -1) {
        updatedBullets.splice(parentIndex + 1, 0, newBullet);
        setBullets(updatedBullets);
      }

      return newBullet.id;
    } catch (error) {
      console.error('Error in createNewBullet:', error);
      toast.error('Failed to create new bullet');
      return null;
    }
  }, [bullets, setBullets]);

  const createNewRootBullet = useCallback(async (): Promise<string> => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      toast.error('Please log in to create bullets');
      return '';
    }

    const allBullets = getAllVisibleBullets(bullets);
    const newAbsolutePosition = allBullets.length;
    // For root bullets, level_position matches absolute_position
    const newLevelPosition = newAbsolutePosition;

    const newBullet = {
      id: generateUbid(),
      content: "",
      children: [],
      isCollapsed: false,
      absolutePosition: newAbsolutePosition,
      levelPosition: newLevelPosition
    };
    
    setBullets([...bullets, newBullet]);

    try {
      const { error } = await supabase
        .from('bullets')
        .insert([{
          id: newBullet.id,
          content: newBullet.content,
          absolute_position: newAbsolutePosition,
          level_position: newLevelPosition,
          is_collapsed: false,
          user_id: session.session.user.id
        }]);

      if (error) {
        console.error('Error creating new root bullet:', error);
        toast.error('Failed to create new root bullet');
      }
    } catch (error) {
      console.error('Error in createNewRootBullet:', error);
      toast.error('Failed to create new root bullet');
    }

    return newBullet.id;
  }, [bullets, setBullets]);

  return {
    createNewBullet,
    createNewRootBullet
  };
};