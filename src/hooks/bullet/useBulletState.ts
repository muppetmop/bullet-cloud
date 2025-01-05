import { useState, useEffect } from "react";
import { BulletPoint } from "@/types/bullet";
import { supabase } from "@/integrations/supabase/client";
import { fetchBulletsForUser, createInitialBullet } from "@/services/bulletService";
import { toast } from "sonner";

export const useBulletState = () => {
  const [bullets, setBullets] = useState<BulletPoint[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get user ID on mount
  useEffect(() => {
    const getUserId = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          setUserId(session.user.id);
          console.info('User session found:', session.user.id);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        toast.error("Error loading user session. Please try signing in again.");
      }
    };
    getUserId();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUserId = session?.user?.id || null;
      console.info('Auth state changed:', { newUserId });
      setUserId(newUserId);
    });

    // Cleanup function that checks for subscription
    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Load initial bullets from Supabase
  useEffect(() => {
    const loadBullets = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      console.info('Fetching bullets for user:', userId);
      setIsLoading(true);
      
      try {
        const data = await fetchBulletsForUser(userId);
        
        if (data && data.length > 0) {
          console.info('Bullets fetched successfully:', {
            count: data.length,
            firstBullet: data[0]
          });
          
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
          
          console.info('Hierarchical bullets created:', {
            rootCount: rootBullets.length,
            totalCount: data.length
          });
          
          setBullets(rootBullets);
          // Save to localStorage
          localStorage.setItem('bullets', JSON.stringify(rootBullets));
          console.info('Saving bullets to localStorage:', {
            count: rootBullets.length,
            firstBullet: rootBullets[0]
          });
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

  return {
    bullets,
    setBullets,
    userId,
    isLoading
  };
};