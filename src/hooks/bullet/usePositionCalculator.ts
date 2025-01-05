import { BulletPoint } from "@/types/bullet";
import { getAllVisibleBullets } from "@/utils/bulletOperations";

export const usePositionCalculator = () => {
  const findNextPosition = (bullets: BulletPoint[], currentBulletId: string | null = null): number => {
    console.log('Finding next position:', { 
      currentBulletId,
      allBullets: bullets.map(b => ({
        id: b.id,
        position: b.position,
        content: b.content
      }))
    });
    
    const allBullets = getAllVisibleBullets(bullets);
    
    if (!currentBulletId) {
      const maxPosition = allBullets.length > 0 ? Math.max(...allBullets.map(b => b.position)) : -1;
      console.log('No current bullet, using max position:', {
        maxPosition,
        newPosition: maxPosition + 1,
        bulletCount: allBullets.length
      });
      return maxPosition + 1;
    }

    const currentIndex = allBullets.findIndex(b => b.id === currentBulletId);
    if (currentIndex === -1) {
      console.error('Current bullet not found:', {
        currentBulletId,
        availableBullets: allBullets.map(b => b.id)
      });
      return allBullets.length;
    }

    const currentPosition = allBullets[currentIndex].position;
    const affectedBullets = allBullets.filter(b => b.position > currentPosition);
    
    console.log('Position calculation:', {
      currentPosition,
      newPosition: currentPosition + 1,
      affectedBullets: affectedBullets.map(b => ({
        id: b.id,
        oldPosition: b.position,
        newPosition: b.position + 1,
        content: b.content
      }))
    });
    
    return currentPosition + 1;
  };

  const findBulletLevel = (bullets: BulletPoint[], currentBulletId: string | null = null): number => {
    if (!currentBulletId) return 0;
    
    const allBullets = getAllVisibleBullets(bullets);
    const currentBullet = allBullets.find(b => b.id === currentBulletId);
    
    console.log('Finding bullet level:', {
      currentBulletId,
      foundLevel: currentBullet?.level || 0,
      bulletFound: !!currentBullet
    });
    
    return currentBullet ? currentBullet.level : 0;
  };

  return {
    findNextPosition,
    findBulletLevel
  };
};