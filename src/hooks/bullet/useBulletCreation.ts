import { BulletPoint } from "@/types/bullet";
import { generateBulletId } from "@/utils/idGenerator";
import { findBulletAndParent } from "@/utils/bulletOperations";
import { addToQueue } from "@/utils/queueManager";
import { usePositionCalculator } from "./usePositionCalculator";
import { supabase } from "@/integrations/supabase/client";

export const useBulletCreation = (
  userId: string | null | undefined,
  bullets: BulletPoint[],
  setBullets: React.Dispatch<React.SetStateAction<BulletPoint[]>>
) => {
  const { findNextPosition, findBulletLevel, updatePositionsAfterInsertion } = usePositionCalculator();

  const createNewBullet = async (id: string, forcedLevel?: number): Promise<string | null> => {
    if (!userId) return null;

    const [bullet, parent] = findBulletAndParent(id, bullets);
    if (!bullet || !parent) {
      console.error('Parent bullet not found:', id);
      return null;
    }

    const newPosition = findNextPosition(bullets, id);
    const newLevel = forcedLevel !== undefined ? forcedLevel : bullet.level;
    const parentId = newLevel > bullet.level ? bullet.id : bullet.parent_id;

    console.log('Creating new bullet:', {
      parentId,
      newPosition,
      newLevel,
      currentBulletLevel: bullet.level
    });

    const newBullet: BulletPoint = {
      id: generateBulletId(),
      content: "",
      children: [],
      isCollapsed: false,
      position: newPosition,
      level: newLevel,
      parent_id: parentId
    };

    // Update positions of affected bullets in the database
    const affectedBullets = await updatePositionsAfterInsertion(bullets, newPosition);
    
    // Queue position updates for affected bullets
    affectedBullets.forEach(bullet => {
      addToQueue({
        id: bullet.id,
        type: 'update',
        data: {
          position: bullet.position + 1
        }
      });
    });

    parent.splice(parent.indexOf(bullet) + 1, 0, newBullet);
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

    const [bullet] = findBulletAndParent(id, bullets);
    if (!bullet) {
      console.error('Parent bullet not found:', id);
      return null;
    }

    const newPosition = findNextPosition(bullets, id);
    const newLevel = forcedLevel !== undefined ? forcedLevel : findBulletLevel(bullets, id);

    console.log('Creating new zoomed bullet:', {
      parentId: id,
      newPosition,
      newLevel
    });

    const newBullet: BulletPoint = {
      id: generateBulletId(),
      content: "",
      children: [],
      isCollapsed: false,
      position: newPosition,
      level: newLevel,
      parent_id: id
    };

    bullet.children.push(newBullet);
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
        parent_id: id
      }
    });

    return newBullet.id;
  };

  const createNewRootBullet = (): string => {
    if (!userId) return "";

    const newPosition = findNextPosition(bullets);
    const newLevel = 0;

    console.log('Creating new root bullet:', {
      newPosition,
      newLevel
    });

    const newBullet: BulletPoint = {
      id: generateBulletId(),
      content: "",
      children: [],
      isCollapsed: false,
      position: newPosition,
      level: newLevel,
      parent_id: null
    };

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
        parent_id: null
      }
    });
    
    setBullets([...bullets, newBullet]);
    return newBullet.id;
  };

  return {
    createNewBullet,
    createNewZoomedBullet,
    createNewRootBullet
  };
};