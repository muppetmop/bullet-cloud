import { useState, useEffect } from "react";
import { BulletPoint } from "@/types/bullet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateBulletId } from "@/utils/idGenerator";

export const useBulletState = (userId: string | null | undefined) => {
  const [bullets, setBullets] = useState<BulletPoint[]>([]);

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

  return { bullets, setBullets };
};