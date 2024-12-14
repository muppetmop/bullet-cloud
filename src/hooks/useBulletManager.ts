import { useCallback } from 'react';
import { useInitialBullets } from './bullet/useInitialBullets';
import { useBulletSync } from './bullet/useBulletSync';
import { useBulletOperations } from './bullet/useBulletOperations';
import { findBulletAndParent, getAllVisibleBullets } from '@/utils/bulletOperations';
import { useBulletOperations as useUIOperations } from '@/hooks/useBulletOperations';

export const useBulletManager = () => {
  const { bullets, setBullets, isLoading } = useInitialBullets();
  const { updateBulletContent } = useBulletSync();
  const { createNewBullet, createNewRootBullet, deleteBullet } = useBulletOperations(bullets, setBullets);
  const { toggleCollapse, indentBullet, outdentBullet } = useUIOperations(bullets, setBullets);

  return {
    bullets,
    isLoading,
    findBulletAndParent,
    getAllVisibleBullets,
    createNewBullet,
    createNewRootBullet,
    updateBullet: updateBulletContent,
    deleteBullet,
    toggleCollapse,
    indentBullet,
    outdentBullet,
  };
};