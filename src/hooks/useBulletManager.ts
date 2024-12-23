import { useEffect } from "react";
import { startSyncService } from "@/services/syncService";
import { useBulletState } from "./bullet/useBulletState";
import { useBulletOperations } from "./bullet/useBulletOperations";
import { useBulletIndentation } from "./bullet/useBulletIndentation";
import { findBulletAndParent, getAllVisibleBullets } from "@/utils/bulletOperations";

export const useBulletManager = () => {
  // Always initialize all hooks at the top level
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

  // Move useEffect to the end, after all other hooks
  useEffect(() => {
    const cleanup = startSyncService();
    return () => cleanup();
  }, []); // Empty dependency array since startSyncService doesn't depend on any props or state

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
  };
};