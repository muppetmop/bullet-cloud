import { useEffect } from "react";
import { startSyncService } from "@/services/syncService";
import { useBulletState } from "./bullet/useBulletState";
import { useBulletOperations } from "./bullet/useBulletOperations";
import { useBulletIndentation } from "./bullet/useBulletIndentation";
import { findBulletAndParent, getAllVisibleBullets } from "@/utils/bulletOperations";

export const useBulletManager = () => {
  const { bullets, setBullets, userId } = useBulletState();
  
  const {
    createNewBullet,
    createNewZoomedBullet,
    createNewRootBullet,
    updateBullet,
    deleteBullet,
    toggleCollapse,
  } = useBulletOperations(userId, bullets, setBullets);

  const {
    indentBullet,
    outdentBullet,
  } = useBulletIndentation(bullets, setBullets);

  // Start sync service
  useEffect(() => {
    const cleanup = startSyncService();
    return () => cleanup();
  }, []);

  return {
    bullets,
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
  };
};