import { useCreateBullet } from './operations/useCreateBullet';
import { useDeleteBullet } from './operations/useDeleteBullet';
import { BulletPoint } from '@/types/bullet';

export const useBulletOperations = (
  bullets: BulletPoint[],
  setBullets: React.Dispatch<React.SetStateAction<BulletPoint[]>>
) => {
  const { createNewBullet, createNewRootBullet } = useCreateBullet(bullets, setBullets);
  const { deleteBullet } = useDeleteBullet(bullets, setBullets);

  return {
    createNewBullet,
    createNewRootBullet,
    deleteBullet
  };
};