import { useSupabaseBullets } from "./bullet/useSupabaseBullets";
import { useBulletOperations } from "./bullet/useBulletOperations";
import { useBulletModification } from "./bullet/useBulletModification";
import { useBulletIndentation } from "./bullet/useBulletIndentation";
import { findBulletAndParent, getAllVisibleBullets } from "@/utils/bulletOperations";

export const useBulletManager = () => {
  const { bullets, setBullets } = useSupabaseBullets();
  const { createNewBullet, createNewRootBullet } = useBulletOperations(bullets, setBullets);
  const { updateBullet, deleteBullet, toggleCollapse } = useBulletModification(bullets, setBullets);
  const { indentBullet, outdentBullet } = useBulletIndentation(bullets, setBullets);

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