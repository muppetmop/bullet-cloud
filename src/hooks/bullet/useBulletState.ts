import { useState, useEffect } from "react";
import { BulletPoint } from "@/types/bullet";
import { supabase } from "@/integrations/supabase/client";
import { fetchBulletsForUser, createInitialBullet } from "@/services/bulletService";
import { toast } from "sonner";

export const useBulletState = () => {
  const [bullets, setBullets] = useState<BulletPoint[]>(() => {
    // Try to load from localStorage first
    const savedBullets = localStorage.getItem('bullets');
    return savedBullets ? JSON.parse(savedBullets) : [];
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get user ID on mount
  useEffect(() => {
    const getUserId = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          setUserId(session.user.id);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        toast.error("Error loading user session. Please try signing in again.");
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
      if (!userId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
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
          // Save to localStorage
          localStorage.setItem('bullets', JSON.stringify(rootBullets));
        } else {
          // Create initial bullet if none exist
          const initialBullet = createInitialBullet(userId);
          setBullets([initialBullet]);
          localStorage.setItem('bullets', JSON.stringify([initialBullet]));
        }
      } catch (error) {
        console.error('Error loading bullets:', error);
        // Try to load from localStorage as fallback
        const savedBullets = localStorage.getItem('bullets');
        if (savedBullets) {
          setBullets(JSON.parse(savedBullets));
          toast.info("Using locally saved bullets while offline");
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBullets();
  }, [userId]);

  // Save to localStorage whenever bullets change
  useEffect(() => {
    if (bullets.length > 0) {
      localStorage.setItem('bullets', JSON.stringify(bullets));
    }
  }, [bullets]);

  return {
    bullets,
    setBullets,
    userId,
    isLoading
  };
};