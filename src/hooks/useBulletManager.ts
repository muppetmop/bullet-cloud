import { useState } from "react";
import { BulletPoint } from "@/types/bullet";

export const useBulletManager = () => {
  const [bullets, setBullets] = useState<BulletPoint[]>([
    { id: crypto.randomUUID(), content: "", children: [], isCollapsed: false },
  ]);

  const findBulletAndParent = (
    id: string,
    bullets: BulletPoint[],
    parent: BulletPoint[] | null = null
  ): [BulletPoint | null, BulletPoint[] | null] => {
    for (let i = 0; i < bullets.length; i++) {
      if (bullets[i].id === id) {
        return [bullets[i], parent || bullets];
      }
      if (!bullets[i].isCollapsed) {
        const [found, foundParent] = findBulletAndParent(
          id,
          bullets[i].children,
          bullets[i].children
        );
        if (found) return [found, foundParent];
      }
    }
    return [null, null];
  };

  const getAllVisibleBullets = (bullets: BulletPoint[]): BulletPoint[] => {
    return bullets.reduce((acc: BulletPoint[], bullet) => {
      return [
        ...acc,
        bullet,
        ...(bullet.isCollapsed ? [] : getAllVisibleBullets(bullet.children)),
      ];
    }, []);
  };

  const createNewBullet = (id: string): string | null => {
    const [bullet, parent] = findBulletAndParent(id, bullets);
    if (!bullet || !parent) return null;

    const newBullet = {
      id: crypto.randomUUID(),
      content: "",
      children: [],
      isCollapsed: false,
    };
    const index = parent.indexOf(bullet);
    parent.splice(index + 1, 0, newBullet);
    setBullets([...bullets]);

    return newBullet.id;
  };

  const createNewRootBullet = (): string => {
    const newBullet = {
      id: crypto.randomUUID(),
      content: "",
      children: [],
      isCollapsed: false,
    };
    setBullets([...bullets, newBullet]);
    return newBullet.id;
  };

  const updateBullet = (id: string, content: string) => {
    const updateBulletRecursive = (bullets: BulletPoint[]): BulletPoint[] => {
      return bullets.map((bullet) => {
        if (bullet.id === id) {
          return { ...bullet, content };
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

  const indentBullet = (id: string) => {
    const [bullet, parent] = findBulletAndParent(id, bullets);
    if (!bullet || !parent) return;

    const index = parent.indexOf(bullet);
    if (index === 0) return; // Can't indent the first bullet in a list

    const previousBullet = parent[index - 1];
    parent.splice(index, 1);
    previousBullet.children.push(bullet);
    setBullets([...bullets]);
  };

  const outdentBullet = (id: string) => {
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

    const parentIndex = grandParent.findIndex((b) => 
      b.children.includes(bullet)
    );
    if (parentIndex === -1) return;

    const bulletIndex = parent.indexOf(bullet);
    parent.splice(bulletIndex, 1);
    grandParent.splice(parentIndex + 1, 0, bullet);
    setBullets([...bullets]);
  };

  const reorderBullets = (draggedId: string, targetId: string, position: 'before' | 'after') => {
    const reorderRecursive = (bullets: BulletPoint[]): [BulletPoint[], BulletPoint | null] => {
      let draggedBullet: BulletPoint | null = null;
      
      // First, remove the dragged bullet
      const newBullets = bullets.filter(bullet => {
        if (bullet.id === draggedId) {
          draggedBullet = { ...bullet };
          return false;
        }
        const [newChildren, found] = reorderRecursive(bullet.children);
        bullet.children = newChildren;
        if (found) {
          draggedBullet = found;
          return true;
        }
        return true;
      });

      // Then, insert it at the target position
      if (draggedBullet) {
        const targetIndex = newBullets.findIndex(b => b.id === targetId);
        if (targetIndex !== -1) {
          newBullets.splice(
            position === 'before' ? targetIndex : targetIndex + 1,
            0,
            draggedBullet
          );
          return [newBullets, null];
        }
        
        // If target wasn't found at this level, check children
        for (const bullet of newBullets) {
          const [newChildren, found] = reorderRecursive(bullet.children);
          bullet.children = newChildren;
          if (found === null) {
            return [newBullets, null];
          }
        }
      }
      
      return [newBullets, draggedBullet];
    };

    const [newBullets] = reorderRecursive(bullets);
    setBullets(newBullets);
  };

  return {
    bullets,
    findBulletAndParent,
    getAllVisibleBullets,
    createNewBullet,
    createNewRootBullet,
    updateBullet,
    deleteBullet,
    toggleCollapse,
    indentBullet,
    outdentBullet,
    reorderBullets,
  };
};
