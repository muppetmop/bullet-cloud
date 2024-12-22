import { BulletPoint } from "@/types/bullet";

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

export const getAllVisibleBullets = (bullets: BulletPoint[]): BulletPoint[] => {
  return bullets.reduce((acc: BulletPoint[], bullet) => {
    return [
      ...acc,
      bullet,
      ...(bullet.isCollapsed ? [] : getAllVisibleBullets(bullet.children)),
    ];
  }, []);
};