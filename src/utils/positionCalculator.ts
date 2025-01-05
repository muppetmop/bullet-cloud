import { BulletPoint } from "@/types/bullet";
import { getAllVisibleBullets } from "./bulletOperations";

const POSITION_BASE = 'a';
const POSITION_SEPARATOR = '_';
const INITIAL_SEGMENT_LENGTH = 4;

const generatePosition = (position: string): string => {
  const segments = position.split(POSITION_SEPARATOR);
  const lastSegment = segments[segments.length - 1];
  const newLastSegment = lastSegment + '1';
  return [...segments.slice(0, -1), newLastSegment].join(POSITION_SEPARATOR);
};

const findNextPosition = (bullets: BulletPoint[], currentBulletId: string | null = null): string => {
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
    if (allBullets.length === 0) {
      return POSITION_BASE.padEnd(INITIAL_SEGMENT_LENGTH, '0');
    }
    const lastBullet = allBullets[allBullets.length - 1];
    return generatePosition(lastBullet.position);
  }

  const currentIndex = allBullets.findIndex(b => b.id === currentBulletId);
  if (currentIndex === -1) {
    console.error('Current bullet not found:', {
      currentBulletId,
      availableBullets: allBullets.map(b => b.id)
    });
    return generatePosition(POSITION_BASE.padEnd(INITIAL_SEGMENT_LENGTH, '0'));
  }

  const currentBullet = allBullets[currentIndex];
  const nextBullet = allBullets[currentIndex + 1];
  
  if (!nextBullet) {
    return generatePosition(currentBullet.position);
  }

  // Insert between current and next bullet
  return currentBullet.position + POSITION_SEPARATOR + '1';
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

export {
  findNextPosition,
  findBulletLevel
};