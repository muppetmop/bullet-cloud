import { useState, useEffect } from 'react';
import { BulletPoint } from '@/types/bullet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateUbid } from '@/utils/idGenerator';

export const useInitialBullets = () => {
  const [bullets, setBullets] = useState<BulletPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
          .order('tree_path');

        if (error) {
          console.error('Error loading bullets:', error);
          toast.error('Failed to load bullets');
          return;
        }

        if (bulletData && bulletData.length > 0) {
          const bulletMap = new Map();
          const rootBullets: BulletPoint[] = [];

          // First pass: create all bullet objects
          bulletData.forEach(bullet => {
            bulletMap.set(bullet.id, {
              id: bullet.id,
              content: bullet.content || '',
              children: [],
              isCollapsed: bullet.is_collapsed,
              treePathArray: bullet.tree_path,
              depth: bullet.depth
            });
          });

          // Second pass: build the hierarchy
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

  return { bullets, setBullets, isLoading };
};