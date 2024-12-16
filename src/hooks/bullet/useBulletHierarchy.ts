import { BulletPoint } from "@/types/bullet";
import { findBulletAndParent } from "@/utils/bulletOperations";
import { generateBulletId } from "@/utils/idGenerator";
import { addToQueue } from "@/utils/queueManager";
import { toast } from "sonner";

export const useBulletHierarchy = (
  userId: string | null,
  bullets: BulletPoint[],
  setBullets: (bullets: BulletPoint[]) => void
) => {
  const createNewBullet = async (id: string): Promise<string | null> => {
    if (!userId) {
      toast.error("Please sign in to create bullets");
      return null;
    }

    const [bullet, parent] = findBulletAndParent(id, bullets);
    if (!bullet || !parent) return null;

    const index = parent.indexOf(bullet);
    const newPosition = bullet.position + 1;
    const newLevel = bullet.level; // Keep the same level as the current bullet

    const newBullet: BulletPoint = {
      id: generateBulletId(),
      content: "",
      children: [],
      isCollapsed: false,
      position: newPosition,
      level: newLevel
    };
    
    // Queue the create operation with user_id, but no parent_id since it's at the same level
    addToQueue({
      id: newBullet.id,
      type: 'create',
      data: {
        id: newBullet.id,
        content: newBullet.content,
        is_collapsed: newBullet.isCollapsed,
        position: newPosition,
        level: newLevel,
        user_id: userId
      }
    });

    const updatePositions = (bullets: BulletPoint[]): BulletPoint[] => {
      return bullets.map(b => {
        if (b.position >= newPosition && b.id !== newBullet.id) {
          return { ...b, position: b.position + 1 };
        }
        return b;
      });
    };

    parent.splice(index + 1, 0, newBullet);
    const updatedBullets = updatePositions(bullets);
    setBullets([...updatedBullets]);

    return newBullet.id;
  };

  const createNewRootBullet = (): string => {
    if (!userId) {
      toast.error("Please sign in to create bullets");
      return "";
    }

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

  const toggleCollapse = (id: string) => {
    const toggleCollapseRecursive = (bullets: BulletPoint[]): BulletPoint[] => {
      return bullets.map((bullet) => {
        if (bullet.id === id) {
          return { ...bullet, isCollapsed: !bullet.isCollapsed };
        }
        return {
          ...bullet,
          children: toggleCollapseRecursive(bullet.children),
        };
      });
    };

    setBullets(toggleCollapseRecursive(bullets));
  };

  const indentBullet = (id: string) => {
    const [bullet, parent] = findBulletAndParent(id, bullets);
    if (!bullet || !parent) return;

    const index = parent.indexOf(bullet);
    if (index === 0) return;

    const previousBullet = parent[index - 1];
    parent.splice(index, 1);
    previousBullet.children.push({
      ...bullet,
      level: bullet.level + 1
    });
    setBullets([...bullets]);
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
    grandParent.splice(parentIndex + 1, 0, {
      ...bullet,
      level: Math.max(0, bullet.level - 1)
    });
    setBullets([...bullets]);
  };

  return {
    createNewBullet,
    createNewRootBullet,
    toggleCollapse,
    indentBullet,
    outdentBullet,
  };
};