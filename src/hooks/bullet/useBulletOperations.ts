import { BulletPoint } from "@/types/bullet";
import { addToQueue } from "@/utils/queueManager";
import { generateBulletId } from "@/utils/idGenerator";
import { findBulletAndParent } from "@/utils/bulletOperations";
import { toast } from "sonner";

export const useBulletOperations = (userId: string | null | undefined, bullets: BulletPoint[], setBullets: (bullets: BulletPoint[]) => void) => {
  const createNewBullet = (id: string, forcedLevel?: number): string | null => {
    if (!userId) {
      toast.error("Please sign in to create bullets");
      return null;
    }

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
    if (!userId) {
      toast.error("Please sign in to create bullets");
      return null;
    }

    const [bullet, parent] = findBulletAndParent(id, bullets);
    if (!bullet || !parent) return null;

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

  const createNewRootBullet = (): string => {
    if (!userId) {
      toast.error("Please sign in to create bullets");
      return "";
    }

    const lastBullet = getAllVisibleBullets(bullets).pop();
    const newPosition = lastBullet ? lastBullet.position + 1 : 0;

    const newBullet: BulletPoint = {
      id: generateBulletId(),
      content: "",
      children: [],
      isCollapsed: false,
      position: newPosition,
      level: 0
    };

    addToQueue({
      id: newBullet.id,
      type: 'create',
      data: {
        id: newBullet.id,
        content: newBullet.content,
        is_collapsed: newBullet.isCollapsed,
        position: newPosition,
        level: 0,
        user_id: userId
      }
    });
    
    setBullets([...bullets, newBullet]);
    return newBullet.id;
  };

  return {
    createNewBullet,
    createNewZoomedBullet,
    createNewRootBullet,
  };
};