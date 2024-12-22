import { useState, useEffect } from "react";
import { BulletPoint } from "@/types/bullet";
import { findBulletAndParent, getAllVisibleBullets } from "@/utils/bulletOperations";
import { addToQueue } from "@/utils/queueManager";
import { startSyncService } from "@/services/syncService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createNewBulletWithParent, createNewRootBulletHelper } from "@/utils/bulletCreation";

export const useBulletManager = () => {
  const [bullets, setBullets] = useState<BulletPoint[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID on mount
  useEffect(() => {
    const getUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
      }
    };
    getUserId();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Start sync service
  useEffect(() => {
    const cleanup = startSyncService();
    return () => cleanup();
  }, []);

  // Load initial bullets from Supabase
  useEffect(() => {
    const loadBullets = async () => {
      if (!userId) return;

      const { data, error } = await supabase
        .from('bullets')
        .select('*')
        .eq('user_id', userId)
        .order('position');
      
      if (error) {
        console.error('Error loading bullets:', error);
        toast.error("Failed to load bullets");
        return;
      }
      
      if (data && data.length > 0) {
        // Convert flat structure to hierarchical
        const bulletMap = new Map<string, BulletPoint>();
        const rootBullets: BulletPoint[] = [];
        
        data.forEach(bullet => {
          bulletMap.set(bullet.id, {
            ...bullet,
            children: [],
            isCollapsed: bullet.is_collapsed
          });
        });
        
        data.forEach(bullet => {
          const bulletPoint = bulletMap.get(bullet.id)!;
          if (bullet.parent_id) {
            const parent = bulletMap.get(bullet.parent_id);
            if (parent) {
              parent.children.push(bulletPoint);
            }
          } else {
            rootBullets.push(bulletPoint);
          }
        });
        
        setBullets(rootBullets);
      } else {
        // Create initial bullet if none exist
        const initialBullet: BulletPoint = {
          id: generateBulletId(),
          content: "",
          children: [],
          isCollapsed: false,
          position: 0,
          level: 0
        };
        setBullets([initialBullet]);
      }
    };
    
    loadBullets();
  }, [userId]);

  const createNewBullet = (id: string): string | null => {
    if (!userId) {
      toast.error("Please sign in to create bullets");
      return null;
    }

    const [newBulletId, updatedBullets] = createNewBulletWithParent(id, bullets, userId);
    if (newBulletId) {
      setBullets(updatedBullets);
    }
    return newBulletId;
  };

  const createNewRootBullet = (): string => {
    if (!userId) {
      toast.error("Please sign in to create bullets");
      return "";
    }

    const [newBulletId, updatedBullets] = createNewRootBulletHelper(bullets, userId);
    setBullets(updatedBullets);
    return newBulletId;
  };

  const updateBullet = (id: string, content: string) => {
    const updateBulletRecursive = (bullets: BulletPoint[]): BulletPoint[] => {
      return bullets.map((bullet) => {
        if (bullet.id === id) {
          const updatedBullet = { ...bullet, content };
          
          // Queue the update operation
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

    // Queue the delete operation
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
          
          // Queue the update operation for collapse state
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

    // Update local state first
    const updatedBullet = {
      ...bullet,
      level: newLevel,
      parent_id: previousBullet.id
    };
    previousBullet.children.push(updatedBullet);
    setBullets([...bullets]);

    // Then queue the update
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

    // Update local state first
    const updatedBullet = {
      ...bullet,
      level: newLevel,
      parent_id: null
    };
    grandParent.splice(parentIndex + 1, 0, updatedBullet);
    setBullets([...bullets]);

    // Then queue the update
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
    createNewRootBullet,
    updateBullet,
    deleteBullet,
    toggleCollapse,
    indentBullet,
    outdentBullet,
  };
};
