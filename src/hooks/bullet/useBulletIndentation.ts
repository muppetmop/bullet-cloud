import { BulletPoint } from "@/types/bullet";
import { findBulletAndParent } from "@/utils/bulletOperations";
import { addToQueue } from "@/utils/queueManager";

export const useBulletIndentation = (
  bullets: BulletPoint[],
  setBullets: React.Dispatch<React.SetStateAction<BulletPoint[]>>
) => {
  const indentBullet = (id: string) => {
    const [bullet, parent] = findBulletAndParent(id, bullets);
    if (!bullet || !parent) return;

    const index = parent.indexOf(bullet);
    if (index === 0) return;

    const previousBullet = parent[index - 1];
    parent.splice(index, 1);
    const newLevel = bullet.level + 1;

    console.log('Indenting bullet:', {
      bulletId: id,
      previousBulletId: previousBullet.id,
      oldLevel: bullet.level,
      newLevel,
      oldParentId: bullet.parent_id,
      newParentId: previousBullet.id
    });

    const updatedBullet = {
      ...bullet,
      level: newLevel,
      parent_id: previousBullet.id
    };
    previousBullet.children.push(updatedBullet);
    setBullets([...bullets]);

    // Queue update with new parent_id and level
    addToQueue({
      id: bullet.id,
      type: 'update',
      data: {
        parent_id: previousBullet.id,
        level: newLevel
      }
    });
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
    const newLevel = Math.max(0, bullet.level - 1);

    // Find the new parent_id by looking at the grandParent's parent_id
    const newParentId = grandParent === bullets ? null : 
      grandParent.find(b => b.children.includes(parent[0]))?.parent_id || null;

    console.log('Outdenting bullet:', {
      bulletId: id,
      oldLevel: bullet.level,
      newLevel,
      oldParentId: bullet.parent_id,
      newParentId,
      grandParentLength: grandParent.length
    });

    const updatedBullet = {
      ...bullet,
      level: newLevel,
      parent_id: newParentId
    };
    grandParent.splice(parentIndex + 1, 0, updatedBullet);
    setBullets([...bullets]);

    // Queue update with new parent_id and level
    addToQueue({
      id: bullet.id,
      type: 'update',
      data: {
        parent_id: newParentId,
        level: newLevel
      }
    });
  };

  return {
    indentBullet,
    outdentBullet,
  };
};