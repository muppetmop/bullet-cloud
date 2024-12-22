import { BulletPoint } from "@/types/bullet";
import { addToQueue } from "@/utils/queueManager";
import { generateBulletId } from "@/utils/idGenerator";

export const useBulletOperations = (userId: string | null, bullets: BulletPoint[], setBullets: (bullets: BulletPoint[]) => void) => {
  const updateBulletTreeRecursively = (
    bullets: BulletPoint[],
    parentId: string,
    newBullet: BulletPoint
  ): BulletPoint[] => {
    return bullets.map(bullet => {
      if (bullet.id === parentId) {
        console.log('Found parent bullet, updating children:', {
          parentId,
          currentChildren: bullet.children,
          newBullet
        });
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

  const createNewBullet = (id: string, forcedLevel?: number): string | null => {
    if (!userId) return null;

    const [bullet, parent] = findBulletAndParent(id, bullets);
    if (!bullet || !parent) return null;

    const index = parent.indexOf(bullet);
    const newPosition = bullet.position + 1;
    const newLevel = forcedLevel !== undefined ? forcedLevel : bullet.level;
    const parentId = newLevel > bullet.level ? bullet.id : bullet.parent_id;

    const newBullet: BulletPoint = {
      id: generateBulletId(),
      content: "",
      children: [],
      isCollapsed: false,
      position: newPosition,
      level: newLevel,
      parent_id: parentId
    };

    parent.splice(index + 1, 0, newBullet);
    setBullets([...bullets]);

    addToQueue({
      id: newBullet.id,
      type: 'create',
      data: {
        id: newBullet.id,
        content: newBullet.content,
        is_collapsed: newBullet.isCollapsed,
        position: newPosition,
        level: newLevel,
        user_id: userId,
        parent_id: parentId
      }
    });

    return newBullet.id;
  };

  const createNewZoomedBullet = (id: string, forcedLevel?: number): string | null => {
    if (!userId) return null;

    console.log('Creating new bullet with parent:', {
      parentId: id,
      forcedLevel,
      currentBullets: bullets
    });

    const [bullet, parent] = findBulletAndParent(id, bullets);
    if (!bullet || !parent) return null;

    const index = parent.indexOf(bullet);
    const newPosition = bullet.position + 1;
    const newLevel = forcedLevel !== undefined ? forcedLevel : bullet.level;
    const parentId = newLevel > bullet.level ? bullet.id : bullet.parent_id;

    const newBullet: BulletPoint = {
      id: generateBulletId(),
      content: "",
      children: [],
      isCollapsed: false,
      position: newPosition,
      level: newLevel,
      parent_id: parentId
    };

    if (parentId) {
      setBullets(prevBullets => updateBulletTreeRecursively(prevBullets, parentId, newBullet));
    } else {
      setBullets(prevBullets => [...prevBullets, newBullet]);
    }

    addToQueue({
      id: newBullet.id,
      type: 'create',
      data: {
        id: newBullet.id,
        content: newBullet.content,
        is_collapsed: newBullet.isCollapsed,
        position: newPosition,
        level: newLevel,
        user_id: userId,
        parent_id: parentId
      }
    });

    return newBullet.id;
  };

  return {
    createNewBullet,
    createNewZoomedBullet,
    updateBulletTreeRecursively
  };
};