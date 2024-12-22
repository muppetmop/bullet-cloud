import { BulletPoint } from "@/types/bullet";
import { useBulletState } from "./bullet/useBulletState";
import { useBulletOperations } from "./bullet/useBulletOperations";
import { useBulletModification } from "./bullet/useBulletModification";
import { useBulletIndentation } from "./bullet/useBulletIndentation";
import { getAllVisibleBullets } from "./bullet/useBulletUtils";

export const useBulletManager = () => {
  const { bullets, setBullets } = useBulletState(null);
  const { createNewBullet, createNewZoomedBullet, createNewRootBullet } = 
    useBulletOperations(null, bullets, setBullets);
  const { updateBullet, deleteBullet, toggleCollapse } = 
    useBulletModification(bullets, setBullets);
  const { indentBullet, outdentBullet } = 
    useBulletIndentation(bullets, setBullets);

  return {
    bullets,
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