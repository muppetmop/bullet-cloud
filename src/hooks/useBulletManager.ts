import { useState, useCallback, useEffect } from "react";
import { BulletPoint } from "@/types/bullet";
import { findBulletAndParent, getAllVisibleBullets } from "@/utils/bulletOperations";
import { syncQueue } from "@/utils/SyncQueue";
import { versionManager } from "@/utils/VersionManager";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useBulletManager = () => {
  const [bullets, setBullets] = useState<BulletPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load bullets on mount
  useEffect(() => {
    const loadBullets = async () => {
      try {
        const { data: bulletData, error } = await supabase
          .from('bullets')
          .select('*')
          .order('position');

        if (error) throw error;

        // Transform the flat data into a tree structure
        const bulletMap = new Map<string, BulletPoint>();
        const rootBullets: BulletPoint[] = [];

        // First pass: Create BulletPoint objects
        bulletData?.forEach(bullet => {
          bulletMap.set(bullet.id, {
            id: bullet.id,
            content: bullet.content || "",
            children: [],
            isCollapsed: bullet.is_collapsed
          });
        });

        // Second pass: Build the tree structure
        bulletData?.forEach(bullet => {
          const bulletPoint = bulletMap.get(bullet.id);
          if (bulletPoint) {
            if (bullet.parent_id) {
              const parent = bulletMap.get(bullet.parent_id);
              if (parent) {
                parent.children.push(bulletPoint);
              }
            } else {
              rootBullets.push(bulletPoint);
            }
          }
        });

        setBullets(rootBullets.length > 0 ? rootBullets : [{
          id: crypto.randomUUID(),
          content: "",
          children: [],
          isCollapsed: false
        }]);
      } catch (error) {
        console.error('Error loading bullets:', error);
        toast.error("Failed to load bullets. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };

    loadBullets();
  }, []);

  const updateBulletContent = useCallback(async (id: string, content: string) => {
    const version = versionManager.updateLocal(id, content);
    
    if (version) {
      syncQueue.addOperation({
        type: 'update',
        bulletId: id,
        data: { 
          content,
          updated_at: new Date().toISOString()
        },
        timestamp: Date.now(),
        retryCount: 0
      });
    }
  }, []);

  const createNewBullet = async (id: string): Promise<string | null> => {
    const [bullet, parent] = findBulletAndParent(id, bullets);
    if (!bullet || !parent) return null;

    const newBulletId = crypto.randomUUID();
    const newBullet = {
      id: newBulletId,
      content: "",
      children: [],
      isCollapsed: false,
    };

    const index = parent.indexOf(bullet);
    parent.splice(index + 1, 0, newBullet);
    setBullets([...bullets]);

    // Save to Supabase
    try {
      const { error } = await supabase
        .from('bullets')
        .insert({
          id: newBulletId,
          content: "",
          parent_id: bullet.parent_id,
          position: index + 1,
          is_collapsed: false
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating bullet:', error);
      toast.error("Failed to save new bullet. Please try again.");
    }

    return newBulletId;
  };

  const createNewRootBullet = async (): Promise<string> => {
    const newBulletId = crypto.randomUUID();
    const newBullet = {
      id: newBulletId,
      content: "",
      children: [],
      isCollapsed: false,
    };

    setBullets([...bullets, newBullet]);

    // Save to Supabase
    try {
      const { error } = await supabase
        .from('bullets')
        .insert({
          id: newBulletId,
          content: "",
          position: bullets.length,
          is_collapsed: false
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating root bullet:', error);
      toast.error("Failed to save new bullet. Please try again.");
    }

    return newBulletId;
  };

  const deleteBullet = async (id: string) => {
    const deleteBulletRecursive = async (bullets: BulletPoint[]): Promise<BulletPoint[]> => {
      const filtered = bullets.filter((bullet) => {
        if (bullet.id === id) {
          // Delete from Supabase
          try {
            syncQueue.addOperation({
              type: 'delete',
              bulletId: id,
              data: null,
              timestamp: Date.now(),
              retryCount: 0
            });
          } catch (error) {
            console.error('Error deleting bullet:', error);
            toast.error("Failed to delete bullet. Please try again.");
          }
          return false;
        }
        bullet.children = deleteBulletRecursive(bullet.children);
        return true;
      });
      return filtered;
    };

    setBullets(await deleteBulletRecursive(bullets));
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
    previousBullet.children.push(bullet);
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
    grandParent.splice(parentIndex + 1, 0, bullet);
    setBullets([...bullets]);
  };

  return {
    bullets,
    isLoading,
    findBulletAndParent,
    getAllVisibleBullets,
    createNewBullet,
    createNewRootBullet,
    updateBullet: updateBulletContent,
    deleteBullet,
    toggleCollapse,
    indentBullet,
    outdentBullet,
  };
};
