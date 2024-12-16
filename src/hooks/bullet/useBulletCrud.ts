import { useState } from "react";
import { BulletPoint } from "@/types/bullet";
import { supabase } from "@/integrations/supabase/client";
import { addToQueue } from "@/utils/queueManager";
import { generateBulletId } from "@/utils/idGenerator";
import { toast } from "sonner";

export const useBulletCrud = (userId: string | null) => {
  const [bullets, setBullets] = useState<BulletPoint[]>([]);

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
  };

  return {
    bullets,
    setBullets,
    loadBullets,
    updateBullet,
    deleteBullet,
  };
};