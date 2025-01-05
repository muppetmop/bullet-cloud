import { useState, useCallback } from "react";
import { BulletPoint } from "@/types/bullet";
import { useBulletCreation } from "./bullet/useBulletCreation";
import { useBulletOperations } from "./bullet/useBulletOperations";
import { useBulletIndentation } from "./bullet/useBulletIndentation";
import { useBulletState } from "./bullet/useBulletState";
import { useAuth } from "@supabase/auth-helpers-react";

export const useBulletManager = () => {
  const user = useAuth();
  const { bullets, setBullets } = useBulletState();
  const { createNewBullet, createNewRootBullet, createNewZoomedBullet } = useBulletCreation(
    user?.id,
    bullets,
    setBullets
  );
  const {
    updateBullet,
    deleteBullet,
    toggleCollapse,
    transferChildren
  } = useBulletOperations(bullets, setBullets);
  const { indentBullet, outdentBullet } = useBulletIndentation(bullets, setBullets);

  const getAllVisibleBullets = useCallback(() => {
    return bullets.reduce((acc: BulletPoint[], bullet) => {
      return [
        ...acc,
        bullet,
        ...(bullet.isCollapsed ? [] : getAllVisibleBullets(bullet.children)),
      ];
    }, []);
  }, [bullets]);

  return {
    bullets,
    setBullets,
    getAllVisibleBullets,
    createNewBullet,
    createNewRootBullet,
    createNewZoomedBullet,
    updateBullet,
    deleteBullet,
    toggleCollapse,
    indentBullet,
    outdentBullet,
    transferChildren,
  };
};

// Helper function to get all visible bullets
const getAllVisibleBullets = (bullets: BulletPoint[]): BulletPoint[] => {
  return bullets.reduce((acc: BulletPoint[], bullet) => {
    return [
      ...acc,
      bullet,
      ...(bullet.isCollapsed ? [] : getAllVisibleBullets(bullet.children)),
    ];
  }, []);
};