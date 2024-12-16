import { useEffect } from "react";
import { startSyncService } from "@/services/syncService";
import { useAuthState } from "./bullet/useAuthState";
import { useBulletCrud } from "./bullet/useBulletCrud";
import { useBulletHierarchy } from "./bullet/useBulletHierarchy";
import { findBulletAndParent, getAllVisibleBullets } from "@/utils/bulletOperations";

export const useBulletManager = () => {
  const { userId } = useAuthState();
  const {
    bullets,
    setBullets,
    loadBullets,
    updateBullet,
    deleteBullet,
  } = useBulletCrud(userId);

  const {
    createNewBullet,
    createNewRootBullet,
    toggleCollapse,
    indentBullet,
    outdentBullet,
  } = useBulletHierarchy(userId, bullets, setBullets);

  // Start sync service
  useEffect(() => {
    const cleanup = startSyncService();
    return () => cleanup();
  }, []);

  // Load initial bullets from Supabase
  useEffect(() => {
    loadBullets();
  }, [userId]);

  return {
    bullets,
    findBulletAndParent,
    getAllVisibleBullets,
    createNewBullet,
    createNewRootBullet,
    updateBullet,
    deleteBullet,
    toggleCollapse,
    indentBullet,
    outdentBullet,
  };
};