import { BulletPoint } from "@/types/bullet";
import { addToQueue } from "@/utils/queueManager";
import { generateBulletId } from "@/utils/idGenerator";
import { findBulletAndParent, getAllVisibleBullets } from "@/utils/bulletOperations";
import React from "react";

const findNextPosition = (bullets: BulletPoint[], currentBulletId: string | null = null): number => {
  // If no currentBulletId, we're adding at the end
  if (!currentBulletId) {
    const allBullets = getAllVisibleBullets(bullets);
    return allBullets.length > 0 ? allBullets[allBullets.length - 1].position + 1 : 0;
  }

  // Find the bullet after the current one
  const allBullets = getAllVisibleBullets(bullets);
  const currentIndex = allBullets.findIndex(b => b.id === currentBulletId);
  
  // If bullet not found or it's the last one, use its position + 1
  if (currentIndex === -1 || currentIndex === allBullets.length - 1) {
    return allBullets[allBullets.length - 1].position + 1;
  }
  
  // Return position right after the current bullet
  return allBullets[currentIndex].position + 1;
};

export const useBulletOperations = (
  userId: string | null | undefined,
  bullets: BulletPoint[],
  setBullets: React.Dispatch<React.SetStateAction<BulletPoint[]>>
) => {
  const createNewBullet = (id: string, forcedLevel?: number): string | null => {
    if (!userId) return null;

    const [bullet, parent] = findBulletAndParent(id, bullets);
    if (!bullet || !parent) {
      console.error('Parent bullet not found:', id);
      return null;
    }

    const newPosition = findNextPosition(bullets, id);
    const newLevel = forcedLevel !== undefined ? forcedLevel : bullet.level;
    const parentId = newLevel > bullet.level ? bullet.id : bullet.parent_id;

    if (parentId) {
      const [parentBullet] = findBulletAndParent(parentId, bullets);
      if (!parentBullet) {
        console.error('Invalid parent ID:', parentId);
        return null;
      }
    }

    const newBullet: BulletPoint = {
      id: generateBulletId(),
      content: "",
      children: [],
      isCollapsed: false,
      position: newPosition,
      level: newLevel,
      parent_id: parentId
    };

    parent.splice(parent.indexOf(bullet) + 1, 0, newBullet);
    setBullets([...bullets]);

    addToQueue({
      id: newBullet.id,
      type: 'create',
      data: {
        id: newBullet.id,
        content: newBullet.content,
        is_collapsed: newBullet.isCollapsed,
        position: newPosition,
        level: newLevel,
        user_id: userId,
        parent_id: parentId
      }
    });

    return newBullet.id;
  };

  const createNewZoomedBullet = (id: string, forcedLevel?: number): string | null => {
    if (!userId) return null;

    const [bullet, parent] = findBulletAndParent(id, bullets);
    if (!bullet || !parent) {
      console.error('Parent bullet not found:', id);
      return null;
    }

    const newPosition = findNextPosition(bullets, id);
    const newLevel = forcedLevel !== undefined ? forcedLevel : bullet.level;
    const parentId = newLevel > bullet.level ? bullet.id : bullet.parent_id;

    if (parentId) {
      const [parentBullet] = findBulletAndParent(parentId, bullets);
      if (!parentBullet) {
        console.error('Invalid parent ID:', parentId);
        return null;
      }
    }

    const newBullet: BulletPoint = {
      id: generateBulletId(),
      content: "",
      children: [],
      isCollapsed: false,
      position: newPosition,
      level: newLevel,
      parent_id: parentId
    };

    if (parentId) {
      setBullets(prevBullets => {
        const updateBulletTree = (bullets: BulletPoint[]): BulletPoint[] => {
          return bullets.map(b => {
            if (b.id === parentId) {
              return {
                ...b,
                children: [...b.children, newBullet]
              };
            }
            if (b.children.length > 0) {
              return {
                ...b,
                children: updateBulletTree(b.children)
              };
            }
            return b;
          });
        };
        return updateBulletTree(prevBullets);
      });
    } else {
      setBullets(prevBullets => [...prevBullets, newBullet]);
    }

    addToQueue({
      id: newBullet.id,
      type: 'create',
      data: {
        id: newBullet.id,
        content: newBullet.content,
        is_collapsed: newBullet.isCollapsed,
        position: newPosition,
        level: newLevel,
        user_id: userId,
        parent_id: parentId
      }
    });

    return newBullet.id;
  };

  const createNewRootBullet = (): string => {
    if (!userId) return "";

    const newPosition = findNextPosition(bullets);

    const newBullet: BulletPoint = {
      id: generateBulletId(),
      content: "",
      children: [],
      isCollapsed: false,
      position: newPosition,
      level: 0,
      parent_id: null
    };

    addToQueue({
      id: newBullet.id,
      type: 'create',
      data: {
        id: newBullet.id,
        content: newBullet.content,
        is_collapsed: newBullet.isCollapsed,
        position: newPosition,
        level: 0,
        user_id: userId,
        parent_id: null
      }
    });
    
    setBullets([...bullets, newBullet]);
    return newBullet.id;
  };

  const updateBullet = (id: string, content: string) => {
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

    // Only update content, not position or other fields
    addToQueue({
      id,
      type: 'update',
      data: {
        content
      }
    });
  };

  const deleteBullet = (id: string) => {
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
    setBullets(prevBullets => {
      const updateBulletChildren = (bullets: BulletPoint[]): BulletPoint[] => {
        return bullets.map(bullet => {
          if (bullet.id === fromBulletId) {
            // Clear children from source bullet
            return { ...bullet, children: [] };
          }
          if (bullet.id === toBulletId) {
            // Find the source bullet to get its children
            const [sourceBullet] = findBulletAndParent(fromBulletId, prevBullets);
            if (sourceBullet) {
              // Transfer children to new bullet
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
      
      // Queue updates for all transferred children
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
