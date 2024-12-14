import { useCallback } from 'react';
import { BulletPoint } from '@/types/bullet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getAllVisibleBullets } from '@/utils/bulletOperations';

const getAllChildIds = (bulletId: string, bullets: BulletPoint[]): string[] => {
  const childIds: string[] = [];
  
  const collectChildIds = (id: string, bulletList: BulletPoint[]) => {
    for (const bullet of bulletList) {
      if (bullet.id === id) {
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

export const useDeleteBullet = (
  bullets: BulletPoint[],
  setBullets: React.Dispatch<React.SetStateAction<BulletPoint[]>>
) => {
  const deleteBullet = useCallback(async (id: string) => {
    const visibleBullets = getAllVisibleBullets(bullets);
    const currentIndex = visibleBullets.findIndex(b => b.id === id);
    const previousBullet = visibleBullets[currentIndex - 1];

    const childIds = getAllChildIds(id, bullets);
    const allIdsToDelete = [id, ...childIds];

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

      const { error } = await supabase
        .from('bullets')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting bullet:', error);
        toast.error('Failed to delete bullet');
        return;
      }

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

  return { deleteBullet };
};