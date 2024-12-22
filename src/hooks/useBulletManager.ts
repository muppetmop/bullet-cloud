import { BulletPoint } from "@/types/bullet";
import { findBulletAndParent, getAllVisibleBullets } from "@/utils/bulletOperations";
import { addToQueue } from "@/utils/queueManager";
import { toast } from "sonner";
import { useBulletOperations } from "./useBulletOperations";
import { useBulletState } from "./useBulletState";
import { supabase } from "@/integrations/supabase/client";
import { generateBulletId } from "@/utils/idGenerator";
import { useEffect, useState } from "react";

export const useBulletManager = () => {
  const [session, setSession] = useState<any>(null);
  
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();
  }, []);

  const userId = session?.user?.id;
  const { bullets, setBullets } = useBulletState(userId);
  const { createNewBullet, createNewZoomedBullet } = useBulletOperations(userId, bullets, setBullets);

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

  const updateBullet = (id: string, content: string) => {
    const updateBulletRecursive = (bullets: BulletPoint[]): BulletPoint[] => {
      return bullets.map((bullet) => {
        if (bullet.id === id) {
          const updatedBullet = { ...bullet, content };
          
          addToQueue({
            id: bullet.id,
            type: 'update',
            data: {
              content: content,
              is_collapsed: bullet.isCollapsed,
              position: bullet.position,
              level: bullet.level
            }
          });
          
          return updatedBullet;
        }
        return {
          ...bullet,
          children: updateBulletRecursive(bullet.children),
        };
      });
    };

    setBullets(updateBulletRecursive(bullets));
  };

  const deleteBullet = (id: string) => {
    const visibleBullets = getAllVisibleBullets(bullets);
    const currentIndex = visibleBullets.findIndex(b => b.id === id);
    const previousBullet = visibleBullets[currentIndex - 1];

    addToQueue({
      id,
      type: 'delete',
      data: null
    });

    const deleteBulletRecursive = (bullets: BulletPoint[]): BulletPoint[] => {
      return bullets.filter((bullet) => {
        if (bullet.id === id) return false;
        bullet.children = deleteBulletRecursive(bullet.children);
        return true;
      });
    };

    setBullets(deleteBulletRecursive(bullets));

    if (previousBullet) {
      setTimeout(() => {
        const previousElement = document.querySelector(
          `[data-id="${previousBullet.id}"] .bullet-content`
        ) as HTMLElement;
        if (previousElement) {
          previousElement.focus();
          const range = document.createRange();
          const selection = window.getSelection();
          range.selectNodeContents(previousElement);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }, 0);
    }
  };

  const toggleCollapse = (id: string) => {
    const toggleCollapseRecursive = (bullets: BulletPoint[]): BulletPoint[] => {
      return bullets.map((bullet) => {
        if (bullet.id === id) {
          const newIsCollapsed = !bullet.isCollapsed;
          
          addToQueue({
            id: bullet.id,
            type: 'update',
            data: {
              is_collapsed: newIsCollapsed,
              content: bullet.content,
              position: bullet.position,
              level: bullet.level,
              parent_id: bullet.parent_id
            }
          });
          
          return { ...bullet, isCollapsed: newIsCollapsed };
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
    const newLevel = bullet.level + 1;

    const updatedBullet = {
      ...bullet,
      level: newLevel,
      parent_id: previousBullet.id
    };
    previousBullet.children.push(updatedBullet);
    setBullets([...bullets]);

    addToQueue({
      id: bullet.id,
      type: 'update',
      data: {
        parent_id: previousBullet.id,
        level: newLevel,
        content: bullet.content,
        is_collapsed: bullet.isCollapsed,
        position: bullet.position
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

    const updatedBullet = {
      ...bullet,
      level: newLevel,
      parent_id: null
    };
    grandParent.splice(parentIndex + 1, 0, updatedBullet);
    setBullets([...bullets]);

    addToQueue({
      id: bullet.id,
      type: 'update',
      data: {
        parent_id: null,
        level: newLevel,
        content: bullet.content,
        is_collapsed: bullet.isCollapsed,
        position: bullet.position
      }
    });
  };

  return {
    bullets,
    findBulletAndParent,
    getAllVisibleBullets,
    createNewBullet,
    createNewZoomedBullet,
    createNewRootBullet,
    updateBullet,
    deleteBullet,
    toggleCollapse,
    indentBullet,
    outdentBullet,
  };
};