import { useCallback } from 'react';
import { BulletPoint } from '@/types/bullet';
import { generateUbid } from '@/utils/idGenerator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { findBulletAndParent, getAllVisibleBullets } from '@/utils/bulletOperations';

export const useBulletOperations = (
  bullets: BulletPoint[],
  setBullets: React.Dispatch<React.SetStateAction<BulletPoint[]>>
) => {
  const createNewBullet = useCallback(async (id: string): Promise<string | null> => {
    const [bullet, parent] = findBulletAndParent(id, bullets);
    if (!bullet || !parent) return null;

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      toast.error('Please log in to create bullets');
      return null;
    }

    const allBullets = getAllVisibleBullets(bullets);
    const currentIndex = allBullets.findIndex(b => b.id === id);
    const newAbsolutePosition = currentIndex + 1;
    
    // Shift all bullets after the new position
    const updatePromises = allBullets.slice(currentIndex + 1).map((b, index) => {
      return supabase
        .from('bullets')
        .update({ absolute_position: newAbsolutePosition + index + 1 })
        .eq('id', b.id);
    });

    // Calculate level position
    const siblingBullets = bullet.children;
    const newLevelPosition = siblingBullets.length;

    const newBullet = {
      id: generateUbid(),
      content: "",
      children: [],
      isCollapsed: false,
      absolutePosition: newAbsolutePosition,
      levelPosition: newLevelPosition
    };
    
    // Insert the new bullet at the correct position
    const index = parent.indexOf(bullet);
    parent.splice(index + 1, 0, newBullet);
    setBullets([...bullets]);

    try {
      // Update positions of existing bullets
      await Promise.all(updatePromises);

      // Create the new bullet
      const { error } = await supabase
        .from('bullets')
        .insert([{
          id: newBullet.id,
          content: newBullet.content,
          parent_id: bullet.id,
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
    } catch (error) {
      console.error('Error in createNewBullet:', error);
      toast.error('Failed to create new bullet');
      return null;
    }

    return newBullet.id;
  }, [bullets, setBullets]);

  const createNewRootBullet = useCallback(async (): Promise<string> => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      toast.error('Please log in to create bullets');
      return '';
    }

    const allBullets = getAllVisibleBullets(bullets);
    const newAbsolutePosition = allBullets.length;
    const newLevelPosition = bullets.length;

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

  const getAllChildIds = (bulletId: string, bullets: BulletPoint[]): string[] => {
    const childIds: string[] = [];
    
    const collectChildIds = (id: string, bulletList: BulletPoint[]) => {
      for (const bullet of bulletList) {
        if (bullet.id === id) {
          // Add all children IDs recursively
          for (const child of bullet.children) {
            childIds.push(child.id);
            collectChildIds(child.id, bullet.children);
          }
          break;
        } else if (bullet.children.length > 0) {
          collectChildIds(id, bullet.children);
        }
      }
    };
    
    collectChildIds(bulletId, bullets);
    return childIds;
  };

  const deleteBullet = useCallback(async (id: string) => {
    const visibleBullets = getAllVisibleBullets(bullets);
    const currentIndex = visibleBullets.findIndex(b => b.id === id);
    const previousBullet = visibleBullets[currentIndex - 1];

    // Get all child IDs that need to be deleted
    const childIds = getAllChildIds(id, bullets);
    const allIdsToDelete = [id, ...childIds];

    // Update absolute positions for remaining bullets
    const updatePromises = visibleBullets
      .slice(currentIndex + 1)
      .filter(b => !allIdsToDelete.includes(b.id))
      .map((b, index) => {
        return supabase
          .from('bullets')
          .update({ absolute_position: currentIndex + index })
          .eq('id', b.id);
      });

    const deleteBulletRecursive = (bullets: BulletPoint[]): BulletPoint[] => {
      return bullets.filter((bullet) => {
        if (allIdsToDelete.includes(bullet.id)) return false;
        bullet.children = deleteBulletRecursive(bullet.children);
        return true;
      });
    };

    setBullets(deleteBulletRecursive(bullets));

    try {
      // First delete all child bullets
      if (childIds.length > 0) {
        const { error: childDeleteError } = await supabase
          .from('bullets')
          .delete()
          .in('id', childIds);

        if (childDeleteError) {
          console.error('Error deleting child bullets:', childDeleteError);
          toast.error('Failed to delete child bullets');
          return;
        }
      }

      // Then delete the parent bullet
      const { error } = await supabase
        .from('bullets')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting bullet:', error);
        toast.error('Failed to delete bullet');
        return;
      }

      // Update positions of remaining bullets
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error in deleteBullet:', error);
      toast.error('Failed to delete bullet');
    }

    if (previousBullet) {
      setTimeout(() => {
        const previousElement = document.querySelector(
          `[data-id="${previousBullet.id}"] .bullet-content`
        ) as HTMLElement;
        if (previousElement) {
          previousElement.focus();
          const range = document.createRange();
          const selection = window.getSelection();
          range.selectNodeContents(previousElement);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }, 0);
    }
  }, [bullets, setBullets]);

  return {
    createNewBullet,
    createNewRootBullet,
    deleteBullet
  };
};
