import { BulletPoint } from "@/types/bullet";

export const findBulletAndParent = (
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

export const getAllVisibleBullets = (bullets: BulletPoint[]): BulletPoint[] => {
  return bullets.reduce((acc: BulletPoint[], bullet) => {
    return [
      ...acc,
      bullet,
      ...(bullet.isCollapsed ? [] : getAllVisibleBullets(bullet.children)),
    ];
  }, []);
};

export const updateBulletTreeRecursively = (
  bullets: BulletPoint[],
  parentId: string,
  newBullet: BulletPoint
): BulletPoint[] => {
  return bullets.map(bullet => {
    if (bullet.id === parentId) {
      return {
        ...bullet,
        children: [...bullet.children, newBullet]
      };
    }
    if (bullet.children.length > 0) {
      return {
        ...bullet,
        children: updateBulletTreeRecursively(bullet.children, parentId, newBullet)
      };
    }
    return bullet;
  });
};