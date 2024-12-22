import { BulletPoint } from "@/types/bullet";
import { generateBulletId } from "./idGenerator";
import { findBulletAndParent } from "./bulletOperations";
import { addToQueue } from "./queueManager";

export const createNewBulletWithParent = (
  id: string,
  bullets: BulletPoint[],
  userId: string | null
): [string | null, BulletPoint[]] => {
  if (!userId) return [null, bullets];

  const [parentBullet] = findBulletAndParent(id, bullets);
  if (!parentBullet) return [null, bullets];

  // Get the level from the parent bullet itself
  // This ensures new bullets are at the same level as other children
  const newLevel = parentBullet.level + 1;
  const lastChild = parentBullet.children[parentBullet.children.length - 1];
  const newPosition = lastChild ? lastChild.position + 1 : parentBullet.position + 1;

  const newBullet: BulletPoint = {
    id: generateBulletId(),
    content: "",
    children: [],
    isCollapsed: false,
    position: newPosition,
    level: newLevel,
    parent_id: id
  };

  // Queue the create operation
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

  // Update local state
  const newBullets = [...bullets];
  const [targetBullet] = findBulletAndParent(id, newBullets);
  if (targetBullet) {
    targetBullet.children.push(newBullet);
  }

  return [newBullet.id, newBullets];
};

export const createNewRootBulletHelper = (
  bullets: BulletPoint[],
  userId: string | null
): [string, BulletPoint[]] => {
  const lastBullet = bullets[bullets.length - 1];
  const newPosition = lastBullet ? lastBullet.position + 1 : 0;

  const newBullet: BulletPoint = {
    id: generateBulletId(),
    content: "",
    children: [],
    isCollapsed: false,
    position: newPosition,
    level: 0
  };

  if (userId) {
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
  }

  return [newBullet.id, [...bullets, newBullet]];
};