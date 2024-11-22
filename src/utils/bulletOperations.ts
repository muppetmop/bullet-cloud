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
  return bullets.reduce((acc: BulletPoint[], bullet) => {
    return [
      ...acc,
      bullet,
      ...(bullet.isCollapsed ? [] : getAllVisibleBullets(bullet.children)),
    ];
  }, []);
};

export const reorderBullets = (
  bullets: BulletPoint[],
  draggedId: string,
  targetId: string,
  position: 'before' | 'after'
): BulletPoint[] => {
  // Find the dragged bullet and its parent
  const [draggedBullet, draggedParent] = findBulletAndParent(draggedId, bullets);
  const [targetBullet, targetParent] = findBulletAndParent(targetId, bullets);

  if (!draggedBullet || !draggedParent || !targetBullet || !targetParent) {
    return bullets;
  }

  // Remove dragged bullet from its current position
  const draggedIndex = draggedParent.indexOf(draggedBullet);
  if (draggedIndex > -1) {
    draggedParent.splice(draggedIndex, 1);
  }

  // Calculate target position
  const targetIndex = targetParent.indexOf(targetBullet);
  
  // Handle insertion based on position and target's children
  if (position === 'after' && targetBullet.children.length > 0 && !targetBullet.isCollapsed) {
    // Insert as first child if dropping after a bullet with children
    targetBullet.children.unshift(draggedBullet);
  } else {
    // Insert at the same level as the target
    const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
    
    // If target and dragged bullets are at the same level, adjust index
    if (targetParent === draggedParent && draggedIndex < targetIndex) {
      targetParent.splice(insertIndex - 1, 0, draggedBullet);
    } else {
      targetParent.splice(insertIndex, 0, draggedBullet);
    }
  }

  // Create a new array to trigger React state update
  return [...bullets];
};