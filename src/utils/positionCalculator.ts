import { BulletPoint } from "@/types/bullet";
import { getAllVisibleBullets } from "./bulletOperations";

const POSITION_BASE = 'a';
const POSITION_SEPARATOR = '_';
const INITIAL_SEGMENT_LENGTH = 4;

const calculateMidpoint = (pos1: string, pos2: string): string => {
  console.log('Calculating midpoint between:', { pos1, pos2 });
  
  // Extract numeric parts and convert to decimal numbers
  const num1 = parseFloat(pos1.replace(POSITION_BASE, ''));
  const num2 = pos2 ? parseFloat(pos2.replace(POSITION_BASE, '')) : num1 + 1.0;
  
  // Calculate the midpoint using decimal arithmetic
  const midpoint = (num1 + num2) / 2;
  
  console.log('Calculated decimal midpoint:', {
    pos1: num1,
    pos2: num2,
    midpoint,
    resultingPosition: POSITION_BASE + midpoint.toFixed(4)
  });
  
  // Format with 4 decimal places to maintain precision
  return POSITION_BASE + midpoint.toFixed(4);
};

const generateSequentialPosition = (lastPosition: string): string => {
  const currentNum = parseFloat(lastPosition.replace(POSITION_BASE, ''));
  const nextNum = currentNum + 1.0;
  return POSITION_BASE + nextNum.toFixed(4);
};

const findNextPosition = (bullets: BulletPoint[], currentBulletId: string | null = null): string => {
  console.log('Finding next position:', { 
    currentBulletId,
    allBullets: bullets.map(b => ({
      id: b.id,
      content: b.content,
      position: b.position
    }))
  });
  
  const allBullets = getAllVisibleBullets(bullets)
    .sort((a, b) => a.position.localeCompare(b.position));
  
  // If no bullets exist or no current bullet specified, start with a0000
  if (!currentBulletId || allBullets.length === 0) {
    return POSITION_BASE + '0.0000';
  }

  const currentIndex = allBullets.findIndex(b => b.id === currentBulletId);
  if (currentIndex === -1) {
    console.error('Current bullet not found:', {
      currentBulletId,
      availableBullets: allBullets.map(b => b.id)
    });
    return POSITION_BASE + '0.0000';
  }

  const currentBullet = allBullets[currentIndex];
  const nextBullet = allBullets[currentIndex + 1];
  
  // If there's no next bullet, generate sequential position
  if (!nextBullet) {
    return generateSequentialPosition(currentBullet.position);
  }

  // Calculate position between current and next bullet
  return calculateMidpoint(currentBullet.position, nextBullet.position);
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
  findBulletLevel,
  calculateMidpoint
};