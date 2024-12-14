import { BulletPoint } from "@/types/bullet";
import { generateUbid } from "@/utils/idGenerator";
import { findBulletAndParent } from "@/utils/bulletOperations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useBulletOperations = (
  bullets: BulletPoint[],
  setBullets: React.Dispatch<React.SetStateAction<BulletPoint[]>>
) => {
  const toggleCollapse = (id: string) => {
    const toggleCollapseRecursive = (bullets: BulletPoint[]): BulletPoint[] => {
      return bullets.map((bullet) => {
        if (bullet.id === id) {
          return { ...bullet, isCollapsed: !bullet.isCollapsed };
        }
        return {
          ...bullet,
          children: toggleCollapseRecursive(bullet.children),
        };
      });
    };

    setBullets(toggleCollapseRecursive(bullets));
  };

  const indentBullet = async (id: string) => {
    const [bullet, parent] = findBulletAndParent(id, bullets);
    if (!bullet || !parent) return;

    const index = parent.indexOf(bullet);
    if (index === 0) return;

    const previousBullet = parent[index - 1];
    
    try {
      // Update the parent_id in Supabase
      const { error } = await supabase
        .from('bullets')
        .update({ 
          parent_id: previousBullet.id,
          level_position: previousBullet.levelPosition + 1
        })
        .eq('id', bullet.id);

      if (error) {
        console.error('Error updating bullet parent:', error);
        toast.error('Failed to indent bullet');
        return;
      }

      // Update local state
      parent.splice(index, 1);
      previousBullet.children.push(bullet);
      setBullets([...bullets]);
    } catch (error) {
      console.error('Error in indentBullet:', error);
      toast.error('Failed to indent bullet');
    }
  };

  const outdentBullet = async (id: string) => {
    const findBulletAndGrandParent = (
      id: string,
      bullets: BulletPoint[],
      parent: BulletPoint[] | null = null,
      grandParent: BulletPoint[] | null = null
    ): [BulletPoint | null, BulletPoint[] | null, BulletPoint[] | null] => {
      for (let i = 0; i < bullets.length; i++) {
        if (bullets[i].id === id) {
          return [bullets[i], parent, grandParent];
        }
        const [found, foundParent, foundGrandParent] = findBulletAndGrandParent(
          id,
          bullets[i].children,
          bullets[i].children,
          parent || bullets
        );
        if (found) return [found, foundParent, foundGrandParent];
      }
      return [null, null, null];
    };

    const [bullet, parent, grandParent] = findBulletAndGrandParent(id, bullets);
    if (!bullet || !parent || !grandParent) return;

    try {
      // Find the parent bullet to get its parent_id
      const parentBullet = bullets.find(b => b.children.includes(bullet));
      const newParentId = parentBullet ? parentBullet.parent_id : null;

      // Update the parent_id in Supabase
      const { error } = await supabase
        .from('bullets')
        .update({ 
          parent_id: newParentId,
          level_position: bullet.absolutePosition // Reset level_position to match absolute_position
        })
        .eq('id', bullet.id);

      if (error) {
        console.error('Error updating bullet parent:', error);
        toast.error('Failed to outdent bullet');
        return;
      }

      // Update local state
      const parentIndex = grandParent.findIndex((b) => 
        b.children.includes(bullet)
      );
      if (parentIndex === -1) return;

      const bulletIndex = parent.indexOf(bullet);
      parent.splice(bulletIndex, 1);
      grandParent.splice(parentIndex + 1, 0, bullet);
      setBullets([...bullets]);
    } catch (error) {
      console.error('Error in outdentBullet:', error);
      toast.error('Failed to outdent bullet');
    }
  };

  return {
    toggleCollapse,
    indentBullet,
    outdentBullet,
  };
};
