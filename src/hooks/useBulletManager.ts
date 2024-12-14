import { useState, useCallback, useEffect } from "react";
import { BulletPoint } from "@/types/bullet";
import { findBulletAndParent, getAllVisibleBullets } from "@/utils/bulletOperations";
import { syncQueue } from "@/utils/SyncQueue";
import { versionManager } from "@/utils/VersionManager";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { generateUbid } from "@/utils/idGenerator";
import { useBulletOperations } from "@/hooks/useBulletOperations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useBulletManager = () => {
  const [bullets, setBullets] = useState<BulletPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial bullets
  useEffect(() => {
    const loadBullets = async () => {
      try {
        const { data: supabaseBullets, error } = await supabase
          .from('bullets')
          .select('*')
          .order('position');

        if (error) throw error;

        // Transform flat Supabase data into hierarchical structure
        const bulletMap = new Map<string, BulletPoint>();
        const rootBullets: BulletPoint[] = [];

        supabaseBullets?.forEach(bullet => {
          bulletMap.set(bullet.id, {
            id: bullet.id,
            content: bullet.content || "",
            children: [],
            isCollapsed: bullet.is_collapsed,
          });
        });

        supabaseBullets?.forEach(bullet => {
          const bulletNode = bulletMap.get(bullet.id);
          if (bulletNode) {
            if (bullet.parent_id) {
              const parent = bulletMap.get(bullet.parent_id);
              if (parent) {
                parent.children.push(bulletNode);
              }
            } else {
              rootBullets.push(bulletNode);
            }
          }
        });

        setBullets(rootBullets.length > 0 ? rootBullets : [{
          id: generateUbid(),
          content: "",
          children: [],
          isCollapsed: false,
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

  const { toggleCollapse, indentBullet, outdentBullet } = useBulletOperations(bullets, setBullets);

  const updateBulletContent = useCallback((id: string, content: string) => {
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

  const handleRealtimeUpdate = useCallback((id: string, content: string) => {
    const updateBulletRecursive = (bullets: BulletPoint[]): BulletPoint[] => {
      return bullets.map((bullet) => {
        if (bullet.id === id) {
          return { ...bullet, content };
        }
        return {
          ...bullet,
          children: updateBulletRecursive(bullet.children),
        };
      });
    };

    setBullets(prev => updateBulletRecursive(prev));
  }, []);

  useRealtimeSync(handleRealtimeUpdate);

  const createNewBullet = async (id: string): Promise<string | null> => {
    const [bullet, parent] = findBulletAndParent(id, bullets);
    if (!bullet || !parent) return null;

    const newBullet = {
      id: generateUbid(),
      content: "",
      children: [],
      isCollapsed: false,
    };

    const index = parent.indexOf(bullet);
    parent.splice(index + 1, 0, newBullet);
    setBullets([...bullets]);

    // Add to sync queue
    syncQueue.addOperation({
      type: 'create',
      bulletId: newBullet.id,
      data: {
        id: newBullet.id,
        content: "",
        parent_id: id,
        position: index + 1,
        is_collapsed: false
      },
      timestamp: Date.now(),
      retryCount: 0
    });

    return newBullet.id;
  };

  const createNewRootBullet = (): string => {
    const newBullet = {
      id: generateUbid(),
      content: "",
      children: [],
      isCollapsed: false,
    };

    setBullets([...bullets, newBullet]);

    // Add to sync queue
    syncQueue.addOperation({
      type: 'create',
      bulletId: newBullet.id,
      data: {
        id: newBullet.id,
        content: "",
        parent_id: null,
        position: bullets.length,
        is_collapsed: false
      },
      timestamp: Date.now(),
      retryCount: 0
    });

    return newBullet.id;
  };

  const updateBullet = (id: string, content: string) => {
    const updateBulletRecursive = (bullets: BulletPoint[]): BulletPoint[] => {
      return bullets.map((bullet) => {
        if (bullet.id === id) {
          return { ...bullet, content };
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

    const deleteBulletRecursive = (bullets: BulletPoint[]): BulletPoint[] => {
      return bullets.filter((bullet) => {
        if (bullet.id === id) {
          // Add delete operation to sync queue
          syncQueue.addOperation({
            type: 'delete',
            bulletId: id,
            data: null,
            timestamp: Date.now(),
            retryCount: 0
          });
          return false;
        }
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