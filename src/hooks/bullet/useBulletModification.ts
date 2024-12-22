import { BulletPoint } from "@/types/bullet";
import { addToQueue } from "@/utils/queueManager";
import { findBulletAndParent } from "@/utils/bulletOperations";

export const useBulletModification = (bullets: BulletPoint[], setBullets: (bullets: BulletPoint[]) => void) => {
  const updateBullet = (id: string, content: string) => {
    const updateBulletRecursive = (bullets: BulletPoint[]): BulletPoint[] => {
      return bullets.map((bullet) => {
        if (bullet.id === id) {
          const updatedBullet = { ...bullet, content };
          
          addToQueue({
            id: bullet.id,
            type: 'update',
            data: {
              content: content,
              is_collapsed: bullet.isCollapsed,
              position: bullet.position,
              level: bullet.level
            }
          });
          
          return updatedBullet;
        }
        return {
          ...bullet,
          children: updateBulletRecursive(bullet.children),
        };
      });
    };

    setBullets(updateBulletRecursive(bullets));
  };

  const deleteBullet = (id: string) => {
    addToQueue({
      id,
      type: 'delete',
      data: null
    });

    const deleteBulletRecursive = (bullets: BulletPoint[]): BulletPoint[] => {
      return bullets.filter((bullet) => {
        if (bullet.id === id) return false;
        bullet.children = deleteBulletRecursive(bullet.children);
        return true;
      });
    };

    setBullets(deleteBulletRecursive(bullets));
  };

  const toggleCollapse = (id: string) => {
    const toggleCollapseRecursive = (bullets: BulletPoint[]): BulletPoint[] => {
      return bullets.map((bullet) => {
        if (bullet.id === id) {
          const newIsCollapsed = !bullet.isCollapsed;
          
          addToQueue({
            id: bullet.id,
            type: 'update',
            data: {
              is_collapsed: newIsCollapsed,
              content: bullet.content,
              position: bullet.position,
              level: bullet.level,
              parent_id: bullet.parent_id
            }
          });
          
          return { ...bullet, isCollapsed: newIsCollapsed };
        }
        return {
          ...bullet,
          children: toggleCollapseRecursive(bullet.children),
        };
      });
    };

    setBullets(toggleCollapseRecursive(bullets));
  };

  return {
    updateBullet,
    deleteBullet,
    toggleCollapse,
  };
};