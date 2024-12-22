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

export const toggleCollapseRecursive = (bullets: BulletPoint[], id: string): BulletPoint[] => {
  return bullets.map((bullet) => {
    if (bullet.id === id) {
      return { ...bullet, isCollapsed: !bullet.isCollapsed };
    }
    return {
      ...bullet,
      children: toggleCollapseRecursive(bullet.children, id),
    };
  });
};

export const deleteBulletRecursive = (bullets: BulletPoint[], id: string): BulletPoint[] => {
  return bullets.filter((bullet) => {
    if (bullet.id === id) return false;
    bullet.children = deleteBulletRecursive(bullet.children, id);
    return true;
  });
};

export const updateBulletRecursive = (
  bullets: BulletPoint[],
  id: string,
  content: string
): BulletPoint[] => {
  return bullets.map((bullet) => {
    if (bullet.id === id) {
      return { ...bullet, content };
    }
    return {
      ...bullet,
      children: updateBulletRecursive(bullet.children, content, id),
    };
  });
};