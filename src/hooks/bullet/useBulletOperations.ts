import { BulletPoint } from "@/types/bullet";
import { addToQueue } from "@/utils/queueManager";
import { generateBulletId } from "@/utils/idGenerator";
import { findBulletAndParent, getAllVisibleBullets, updateBulletTreeRecursively } from "@/utils/bulletOperations";
import React from "react";

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

    const index = parent.indexOf(bullet);
    const newPosition = bullet.position + 1;
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

    // Create a new array to trigger re-render
    const newBullets = [...bullets];
    parent.splice(index + 1, 0, newBullet);
    setBullets(newBullets);

    // Queue the create operation
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

    const newPosition = bullet.position + 1;
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

    setBullets(prevBullets => {
      if (parentId) {
        return updateBulletTreeRecursively(prevBullets, parentId, newBullet);
      }
      return [...prevBullets, newBullet];
    });

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

    const lastBullet = getAllVisibleBullets(bullets).pop();
    const newPosition = lastBullet ? lastBullet.position + 1 : 0;

    const newBullet: BulletPoint = {
      id: generateBulletId(),
      content: "",
      children: [],
      isCollapsed: false,
      position: newPosition,
      level: 0,
      parent_id: null
    };

    setBullets(prevBullets => [...prevBullets, newBullet]);

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
    
    return newBullet.id;
  };

  const updateBullet = (id: string, content: string) => {
    console.log('Updating bullet:', { id, content });
    
    setBullets(prevBullets => {
      const updateBulletContent = (bullets: BulletPoint[]): BulletPoint[] => {
        return bullets.map(bullet => {
          if (bullet.id === id) {
            console.log('Found bullet to update:', { id: bullet.id, oldContent: bullet.content, newContent: content });
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
      
      const newBullets = updateBulletContent(prevBullets);
      console.log('Updated bullets:', newBullets);
      return newBullets;
    });

    // Queue the update operation
    addToQueue({
      id,
      type: 'update',
      data: {
        content,
        is_collapsed: false,
        position: 0,
        level: 0
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