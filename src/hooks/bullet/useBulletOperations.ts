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

    const newBullet = {
      id: generateUbid(),
      content: "",
      children: [],
      isCollapsed: false,
    };
    
    const index = parent.indexOf(bullet);
    parent.splice(index + 1, 0, newBullet);
    setBullets([...bullets]);

    try {
      const { error } = await supabase
        .from('bullets')
        .insert([{
          id: newBullet.id,
          content: newBullet.content,
          parent_id: bullet.id,
          position: index + 1,
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

    const newBullet = {
      id: generateUbid(),
      content: "",
      children: [],
      isCollapsed: false,
    };
    
    setBullets([...bullets, newBullet]);

    try {
      const { error } = await supabase
        .from('bullets')
        .insert([{
          id: newBullet.id,
          content: newBullet.content,
          position: bullets.length,
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

  const deleteBullet = useCallback(async (id: string) => {
    const visibleBullets = getAllVisibleBullets(bullets);
    const currentIndex = visibleBullets.findIndex(b => b.id === id);
    const previousBullet = visibleBullets[currentIndex - 1];

    const deleteBulletRecursive = (bullets: BulletPoint[]): BulletPoint[] => {
      return bullets.filter((bullet) => {
        if (bullet.id === id) return false;
        bullet.children = deleteBulletRecursive(bullet.children);
        return true;
      });
    };

    setBullets(deleteBulletRecursive(bullets));

    try {
      // Delete the bullet and all its children using tree_path
      const { error } = await supabase
        .from('bullets')
        .delete()
        .filter('tree_path', 'cs', `{${id}}`);

      if (error) {
        console.error('Error deleting bullet:', error);
        toast.error('Failed to delete bullet');
      }
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