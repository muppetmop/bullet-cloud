import { useState, useCallback } from "react";
import { BulletPoint } from "@/types/bullet";
import { findBulletAndParent, getAllVisibleBullets } from "@/utils/bulletOperations";
import { syncQueue } from "@/utils/SyncQueue";
import { versionManager } from "@/utils/VersionManager";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { generateUbid } from "@/utils/idGenerator";
import { useBulletOperations } from "@/hooks/useBulletOperations";
import { supabase } from "@/integrations/supabase/client";

export const useBulletManager = () => {
  const [bullets, setBullets] = useState<BulletPoint[]>([
    { id: generateUbid(), content: "", children: [], isCollapsed: false },
  ]);

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

  const createNewBullet = (id: string): string | null => {
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

  return {
    bullets,
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
