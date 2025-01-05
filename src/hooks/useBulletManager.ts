import { useEffect } from "react";
import { startSyncService } from "@/services/syncService";
import { useBulletState } from "./bullet/useBulletState";
import { useBulletOperations } from "./bullet/useBulletOperations";
import { useBulletIndentation } from "./bullet/useBulletIndentation";
import { findBulletAndParent, getAllVisibleBullets } from "@/utils/bulletOperations";

export const useBulletManager = () => {
  // Always initialize all hooks at the top level
  const { bullets, setBullets, userId, isLoading } = useBulletState();
  
  const {
    createNewBullet,
    createNewZoomedBullet,
    createNewRootBullet,
    updateBullet,
    deleteBullet,
    toggleCollapse,
    transferChildren,
  } = useBulletOperations(userId, bullets, setBullets);

  const {
    indentBullet,
    outdentBullet,
  } = useBulletIndentation(bullets, setBullets);

  // Move useEffect to the end, after all other hooks
  useEffect(() => {
    if (!isLoading) {  // Only start sync service after initial loading
      console.log('Starting sync service with state:', {
        userId,
        bulletsCount: bullets.length
      });
      const cleanup = startSyncService();
      return () => {
        console.log('Cleaning up sync service');
        cleanup();
      };
    }
  }, [isLoading]); // Add isLoading as dependency

  return {
    bullets,
    setBullets,
    findBulletAndParent,
    getAllVisibleBullets,
    createNewBullet,
    createNewZoomedBullet,
    createNewRootBullet,
    updateBullet,
    deleteBullet,
    toggleCollapse,
    indentBullet,
    outdentBullet,
    transferChildren,
  };
};