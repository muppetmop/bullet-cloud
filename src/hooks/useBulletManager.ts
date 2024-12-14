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

  const { toggleCollapse, indentBullet, outdentBullet } = useBulletOperations(bullets, setBullets);

  // Load initial bullets
  useEffect(() => {
    const loadBullets = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          console.error('No session found');
          return;
        }

        const { data: bulletData, error } = await supabase
          .from('bullets')
          .select('*')
          .eq('user_id', session.session.user.id)
          .order('position');

        if (error) {
          console.error('Error loading bullets:', error);
          toast.error('Failed to load bullets');
          return;
        }

        if (bulletData && bulletData.length > 0) {
          // Convert flat structure to tree
          const bulletMap = new Map();
          const rootBullets: BulletPoint[] = [];

          bulletData.forEach(bullet => {
            bulletMap.set(bullet.id, {
              id: bullet.id,
              content: bullet.content || '',
              children: [],
              isCollapsed: bullet.is_collapsed
            });
          });

          bulletData.forEach(bullet => {
            const bulletNode = bulletMap.get(bullet.id);
            if (bullet.parent_id) {
              const parent = bulletMap.get(bullet.parent_id);
              if (parent) {
                parent.children.push(bulletNode);
              }
            } else {
              rootBullets.push(bulletNode);
            }
          });

          setBullets(rootBullets);
        } else {
          // Create initial bullet if none exist
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) {
            toast.error('Please log in to create bullets');
            return;
          }

          const newBullet = {
            id: generateUbid(),
            content: "",
            children: [],
            isCollapsed: false,
          };
          
          const { error: insertError } = await supabase
            .from('bullets')
            .insert([{
              id: newBullet.id,
              content: newBullet.content,
              position: 0,
              is_collapsed: false,
              user_id: session.session.user.id
            }]);

          if (insertError) {
            console.error('Error creating initial bullet:', insertError);
            toast.error('Failed to create initial bullet');
            return;
          }

          setBullets([newBullet]);
        }
      } catch (error) {
        console.error('Error in loadBullets:', error);
        toast.error('Failed to load bullets');
      } finally {
        setIsLoading(false);
      }
    };

    loadBullets();
  }, []);

  const updateBulletContent = useCallback(async (id: string, content: string) => {
    const version = versionManager.updateLocal(id, content);
    
    if (version) {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error('Please log in to update bullets');
        return;
      }

      syncQueue.addOperation({
        type: 'update',
        bulletId: id,
        data: { 
          content,
          updated_at: new Date().toISOString(),
          user_id: session.session.user.id
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

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      toast.error('Please log in to create bullets');
      return null;
    }

    const newBullet = {
      id: generateUbid(),
      content: "",
      children: [],
      isCollapsed: false,
    };
    
    const index = parent.indexOf(bullet);
    parent.splice(index + 1, 0, newBullet);
    setBullets([...bullets]);

    try {
      const { error } = await supabase
        .from('bullets')
        .insert([{
          id: newBullet.id,
          content: newBullet.content,
          parent_id: bullet.id,
          position: index + 1,
          is_collapsed: false,
          user_id: session.session.user.id
        }]);

      if (error) {
        console.error('Error creating new bullet:', error);
        toast.error('Failed to create new bullet');
        return null;
      }
    } catch (error) {
      console.error('Error in createNewBullet:', error);
      toast.error('Failed to create new bullet');
      return null;
    }

    return newBullet.id;
  };

  const createNewRootBullet = async (): Promise<string> => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      toast.error('Please log in to create bullets');
      return '';
    }

    const newBullet = {
      id: generateUbid(),
      content: "",
      children: [],
      isCollapsed: false,
    };
    
    setBullets([...bullets, newBullet]);

    try {
      const { error } = await supabase
        .from('bullets')
        .insert([{
          id: newBullet.id,
          content: newBullet.content,
          position: bullets.length,
          is_collapsed: false,
          user_id: session.session.user.id
        }]);

      if (error) {
        console.error('Error creating new root bullet:', error);
        toast.error('Failed to create new root bullet');
      }
    } catch (error) {
      console.error('Error in createNewRootBullet:', error);
      toast.error('Failed to create new root bullet');
    }

    return newBullet.id;
  };

  const deleteBullet = async (id: string) => {
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

    try {
      const { error } = await supabase
        .from('bullets')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting bullet:', error);
        toast.error('Failed to delete bullet');
      }
    } catch (error) {
      console.error('Error in deleteBullet:', error);
      toast.error('Failed to delete bullet');
    }

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