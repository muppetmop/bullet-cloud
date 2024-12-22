import { useState } from 'react';
import { BulletPoint } from '@/types/bullet';

export const useTheirsBulletState = () => {
  const [theirsBullets, setTheirsBullets] = useState<{[key: string]: BulletPoint[]}>({});

  const updateTheirsBullet = (userId: string, bulletId: string, updates: Partial<BulletPoint>) => {
    console.log('Updating theirs bullet:', {
      userId,
      bulletId,
      updates
    });

    setTheirsBullets(prev => {
      const userBullets = prev[userId] || [];
      const updatedBullets = userBullets.map(bullet => {
        if (bullet.id === bulletId) {
          console.log('Found bullet to update:', {
            before: bullet,
            after: { ...bullet, ...updates }
          });
          return { ...bullet, ...updates };
        }
        if (bullet.children.length > 0) {
          return {
            ...bullet,
            children: updateBulletTreeRecursively(bullet.children, bulletId, updates)
          };
        }
        return bullet;
      });

      return {
        ...prev,
        [userId]: updatedBullets
      };
    });
  };

  const updateBulletTreeRecursively = (
    bullets: BulletPoint[],
    bulletId: string,
    updates: Partial<BulletPoint>
  ): BulletPoint[] => {
    return bullets.map(bullet => {
      if (bullet.id === bulletId) {
        console.log('Found nested bullet to update:', {
          before: bullet,
          after: { ...bullet, ...updates }
        });
        return { ...bullet, ...updates };
      }
      if (bullet.children.length > 0) {
        return {
          ...bullet,
          children: updateBulletTreeRecursively(bullet.children, bulletId, updates)
        };
      }
      return bullet;
    });
  };

  const setUserBullets = (userId: string, bullets: BulletPoint[]) => {
    console.log('Setting user bullets:', {
      userId,
      bulletCount: bullets.length,
      bullets: bullets.map(b => ({
        id: b.id,
        content: b.content,
        level: b.level,
        childrenCount: b.children.length
      }))
    });

    setTheirsBullets(prev => ({
      ...prev,
      [userId]: bullets
    }));
  };

  return {
    theirsBullets,
    updateTheirsBullet,
    setUserBullets
  };
};