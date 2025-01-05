import { BulletPoint } from "@/types/bullet";
import { getAllVisibleBullets } from "@/utils/bulletOperations";

export const usePositionCalculator = () => {
  const findNextPosition = (bullets: BulletPoint[], currentBulletId: string | null = null): number => {
    console.log('Finding next position:', { currentBulletId });
    const allBullets = getAllVisibleBullets(bullets);
    
    if (!currentBulletId) {
      const maxPosition = allBullets.length > 0 ? Math.max(...allBullets.map(b => b.position)) : -1;
      console.log('No current bullet, using max position:', maxPosition);
      return maxPosition + 1;
    }

    const currentIndex = allBullets.findIndex(b => b.id === currentBulletId);
    if (currentIndex === -1) {
      console.error('Current bullet not found:', currentBulletId);
      return allBullets.length;
    }

    const currentPosition = allBullets[currentIndex].position;
    console.log('Found current bullet position:', { currentPosition, newPosition: currentPosition + 1 });
    return currentPosition + 1;
  };

  const findBulletLevel = (bullets: BulletPoint[], currentBulletId: string | null = null): number => {
    if (!currentBulletId) return 0;
    
    const allBullets = getAllVisibleBullets(bullets);
    const currentBullet = allBullets.find(b => b.id === currentBulletId);
    return currentBullet ? currentBullet.level : 0;
  };

  return {
    findNextPosition,
    findBulletLevel
  };
};