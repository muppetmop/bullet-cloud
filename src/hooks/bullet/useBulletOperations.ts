import { BulletPoint } from "@/types/bullet";
import { addToQueue } from "@/utils/queueManager";
import { findBulletAndParent } from "@/utils/bulletOperations";
import React from "react";
import { useBulletCreation } from "./useBulletCreation";

export const useBulletOperations = (
  userId: string | null | undefined,
  bullets: BulletPoint[],
  setBullets: React.Dispatch<React.SetStateAction<BulletPoint[]>>
) => {
  const {
    createNewBullet,
    createNewZoomedBullet,
    createNewRootBullet
  } = useBulletCreation(userId, bullets, setBullets);

  const updateBullet = (id: string, content: string) => {
    console.log('Updating bullet content:', { id, content });
    
    setBullets(prevBullets => {
      const updateBulletContent = (bullets: BulletPoint[]): BulletPoint[] => {
        return bullets.map(bullet => {
          if (bullet.id === id) {
            return { ...bullet, content };
          }
          if (bullet.children.length > 0) {
            return {
              ...bullet,
              children: updateBulletContent(bullet.children)
            };
          }
          return bullet;
        });
      };
      return updateBulletContent(prevBullets);
    });

    // Only update content, not position
    addToQueue({
      id,
      type: 'update',
      data: {
        content
      }
    });
  };

  const deleteBullet = (id: string) => {
    console.log('Deleting bullet:', { id });
    
    setBullets(prevBullets => {
      const deleteBulletById = (bullets: BulletPoint[]): BulletPoint[] => {
        return bullets.filter(bullet => {
          if (bullet.id === id) return false;
          if (bullet.children.length > 0) {
            bullet.children = deleteBulletById(bullet.children);
          }
          return true;
        });
      };
      return deleteBulletById(prevBullets);
    });

    addToQueue({
      id,
      type: 'delete',
      data: null
    });
  };

  const toggleCollapse = (id: string) => {
    setBullets(prevBullets => {
      const toggleBulletCollapse = (bullets: BulletPoint[]): BulletPoint[] => {
        return bullets.map(bullet => {
          if (bullet.id === id) {
            return { ...bullet, isCollapsed: !bullet.isCollapsed };
          }
          if (bullet.children.length > 0) {
            return {
              ...bullet,
              children: toggleBulletCollapse(bullet.children)
            };
          }
          return bullet;
        });
      };
      return toggleBulletCollapse(prevBullets);
    });
  };

  const transferChildren = (fromBulletId: string, toBulletId: string) => {
    console.log('Transferring children:', { fromBulletId, toBulletId });
    
    setBullets(prevBullets => {
      const updateBulletChildren = (bullets: BulletPoint[]): BulletPoint[] => {
        return bullets.map(bullet => {
          if (bullet.id === fromBulletId) {
            return { ...bullet, children: [] };
          }
          if (bullet.id === toBulletId) {
            const [sourceBullet] = findBulletAndParent(fromBulletId, prevBullets);
            if (sourceBullet) {
              return { 
                ...bullet, 
                children: sourceBullet.children.map(child => ({
                  ...child,
                  parent_id: toBulletId
                }))
              };
            }
          }
          if (bullet.children.length > 0) {
            return {
              ...bullet,
              children: updateBulletChildren(bullet.children)
            };
          }
          return bullet;
        });
      };
      
      const newBullets = updateBulletChildren(prevBullets);
      
      const [sourceBullet] = findBulletAndParent(fromBulletId, prevBullets);
      if (sourceBullet) {
        sourceBullet.children.forEach(child => {
          addToQueue({
            id: child.id,
            type: 'update',
            data: {
              parent_id: toBulletId
            }
          });
        });
      }
      
      return newBullets;
    });
  };

  return {
    createNewBullet,
    createNewZoomedBullet,
    createNewRootBullet,
    updateBullet,
    deleteBullet,
    toggleCollapse,
    transferChildren,
  };
};