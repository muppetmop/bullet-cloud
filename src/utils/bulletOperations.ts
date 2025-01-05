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
  const sortedBullets = [...bullets].sort((a, b) => a.position.localeCompare(b.position));
  return sortedBullets.reduce((acc: BulletPoint[], bullet) => {
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
      const sortedChildren = [...bullet.children, newBullet]
        .sort((a, b) => a.position.localeCompare(b.position));
      return {
        ...bullet,
        children: sortedChildren
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