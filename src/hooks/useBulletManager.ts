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

  return {
    bullets,
    findBulletAndParent,
    getAllVisibleBullets,
    createNewBullet,
    createNewRootBullet,
    updateBullet,
    deleteBullet,
    toggleCollapse,
  };
};