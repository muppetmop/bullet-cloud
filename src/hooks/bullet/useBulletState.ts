import { useState, useEffect } from "react";
import { BulletPoint } from "@/types/bullet";
import { supabase } from "@/integrations/supabase/client";
import { fetchBulletsForUser, createInitialBullet } from "@/services/bulletService";

export const useBulletState = () => {
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

  // Load initial bullets from Supabase
  useEffect(() => {
    const loadBullets = async () => {
      if (!userId) return;

      const data = await fetchBulletsForUser(userId);
      
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
        setBullets([createInitialBullet(userId)]);
      }
    };
    
    loadBullets();
  }, [userId]);

  return {
    bullets,
    setBullets,
    userId
  };
};