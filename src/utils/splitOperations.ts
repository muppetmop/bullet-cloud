import { BulletPoint } from "@/types/bullet";

export const performOptimisticSplit = (
  bullets: BulletPoint[],
  originalBulletId: string,
  beforeCursor: string,
  afterCursor: string
): [BulletPoint[], string] => {
  const newBulletId = crypto.randomUUID();
  
  const updateBulletsRecursively = (items: BulletPoint[]): BulletPoint[] => {
    return items.map(bullet => {
      if (bullet.id === originalBulletId) {
        return {
          ...bullet,
          content: beforeCursor,
          children: [
            {
              id: newBulletId,
              content: afterCursor,
              children: [],
              isCollapsed: false
            },
            ...bullet.children
          ]
        };
      }
      
      if (bullet.children.length > 0) {
        return {
          ...bullet,
          children: updateBulletsRecursively(bullet.children)
        };
      }
      
      return bullet;
    });
  };

  const updatedBullets = updateBulletsRecursively(bullets);
  return [updatedBullets, newBulletId];
};