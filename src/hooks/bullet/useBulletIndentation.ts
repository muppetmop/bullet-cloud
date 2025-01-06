import { BulletPoint } from "@/types/bullet";
import { addToQueue } from "@/utils/queueManager";
import { findNextPosition } from "@/utils/positionCalculator";

export const useBulletIndentation = (
  bullets: BulletPoint[],
  setBullets: React.Dispatch<React.SetStateAction<BulletPoint[]>>
) => {
  const indentBullet = (id: string) => {
    const findBulletAndParent = (
      searchId: string,
      items: BulletPoint[]
    ): [BulletPoint | null, BulletPoint[], number] => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === searchId) {
          return [items[i], items, i];
        }
        const [found, parent, index] = findBulletAndParent(searchId, items[i].children);
        if (found) {
          return [found, parent, index];
        }
      }
      return [null, [], -1];
    };

    const [bullet, parent, index] = findBulletAndParent(id, bullets);
    if (!bullet || index === 0) return;

    const previousBullet = parent[index - 1];
    parent.splice(index, 1);
    const newLevel = bullet.level + 1;
    
    // Calculate new position as string
    const newPosition = findNextPosition(previousBullet.children);

    console.log('Indenting bullet:', {
      bulletId: id,
      previousBulletId: previousBullet.id,
      oldLevel: bullet.level,
      newLevel,
      oldParentId: bullet.parent_id,
      newParentId: previousBullet.id,
      newPosition
    });

    const updatedBullet = {
      ...bullet,
      level: newLevel,
      parent_id: previousBullet.id,
      position: newPosition
    };

    previousBullet.children.push(updatedBullet);
    setBullets([...bullets]);

    // Queue update with new parent_id, level and position as strings
    addToQueue({
      id: bullet.id,
      type: 'update',
      data: {
        parent_id: previousBullet.id,
        level: newLevel,
        position: newPosition
      }
    });
  };

  const outdentBullet = (id: string) => {
    const findBulletAndParents = (
      searchId: string,
      items: BulletPoint[],
      path: BulletPoint[][] = []
    ): [BulletPoint | null, BulletPoint[], number, BulletPoint[][]] => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === searchId) {
          return [items[i], items, i, path];
        }
        const [found, parent, index, newPath] = findBulletAndParents(
          searchId,
          items[i].children,
          [...path, items]
        );
        if (found) {
          return [found, parent, index, newPath];
        }
      }
      return [null, [], -1, path];
    };

    const [bullet, parent, bulletIndex, path] = findBulletAndParents(id, bullets);
    if (!bullet || path.length === 0) return;

    const grandParent = path[path.length - 1];
    const parentIndex = grandParent.findIndex((b) => b.children.includes(parent[0]));
    if (parentIndex === -1) return;

    parent.splice(bulletIndex, 1);
    const newLevel = Math.max(0, bullet.level - 1);

    // Find the new parent_id by looking at the grandParent's parent_id
    const newParentId = grandParent === bullets ? null : 
      grandParent.find(b => b.children.includes(parent[0]))?.parent_id || null;

    // Calculate new position as string
    const newPosition = findNextPosition(grandParent);

    console.log('Outdenting bullet:', {
      bulletId: id,
      oldLevel: bullet.level,
      newLevel,
      oldParentId: bullet.parent_id,
      newParentId,
      grandParentLength: grandParent.length,
      newPosition
    });

    const updatedBullet = {
      ...bullet,
      level: newLevel,
      parent_id: newParentId,
      position: newPosition
    };
    
    grandParent.splice(parentIndex + 1, 0, updatedBullet);
    setBullets([...bullets]);

    // Queue update with new parent_id, level and position as strings
    addToQueue({
      id: bullet.id,
      type: 'update',
      data: {
        parent_id: newParentId,
        level: newLevel,
        position: newPosition
      }
    });
  };

  return {
    indentBullet,
    outdentBullet,
  };
};