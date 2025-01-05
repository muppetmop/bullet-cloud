import { useState, useEffect } from "react";
import { BulletPoint } from "@/types/bullet";
import { supabase } from "@/integrations/supabase/client";
import { fetchBulletsForUser, createInitialBullet } from "@/services/bulletService";
import { toast } from "sonner";

export const useBulletState = () => {
  const [bullets, setBullets] = useState<BulletPoint[]>(() => {
    const savedBullets = localStorage.getItem('bullets');
    return savedBullets ? JSON.parse(savedBullets) : [];
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Get user ID on mount
  useEffect(() => {
    const getUserId = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          console.log('User session found:', session.user.id);
          setUserId(session.user.id);
        } else {
          console.log('No user session found');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        toast.error("Error loading user session. Please try signing in again.");
        setIsLoading(false);
      }
    };
    getUserId();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUserId = session?.user?.id || null;
      console.log('Auth state changed:', { newUserId });
      setUserId(newUserId);
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
      setError(null);
      
      try {
        console.log('Fetching bullets for user:', userId);
        const data = await fetchBulletsForUser(userId);
        
        if (data && data.length > 0) {
          console.log('Bullets fetched successfully:', {
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
              } else {
                console.warn('Parent bullet not found:', bullet.parent_id);
                rootBullets.push(bulletPoint);
              }
            } else {
              rootBullets.push(bulletPoint);
            }
          });
          
          console.log('Hierarchical bullets created:', {
            rootCount: rootBullets.length,
            totalCount: data.length
          });
          
          setBullets(rootBullets);
          localStorage.setItem('bullets', JSON.stringify(rootBullets));
        } else {
          console.log('No bullets found, creating initial bullet');
          const initialBullet = createInitialBullet(userId);
          setBullets([initialBullet]);
          localStorage.setItem('bullets', JSON.stringify([initialBullet]));
        }
      } catch (error) {
        console.error('Error loading bullets:', error);
        setError(error as Error);
        
        // Try to load from localStorage as fallback
        const savedBullets = localStorage.getItem('bullets');
        if (savedBullets) {
          console.log('Loading bullets from localStorage fallback');
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
      console.log('Saving bullets to localStorage:', {
        count: bullets.length,
        firstBullet: bullets[0]
      });
      localStorage.setItem('bullets', JSON.stringify(bullets));
    }
  }, [bullets]);

  return {
    bullets,
    setBullets,
    userId,
    isLoading,
    error
  };
};