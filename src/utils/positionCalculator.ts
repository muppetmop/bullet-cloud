import { BulletPoint } from "@/types/bullet";
import { getAllVisibleBullets } from "./bulletOperations";

const POSITION_BASE = 'a';
const POSITION_SEPARATOR = '_';
const INITIAL_SEGMENT_LENGTH = 4;
const POSITION_INCREMENT = 1;

const calculateMidpoint = (pos1: string, pos2: string): string => {
  // If positions have different lengths or contain separators, 
  // append to the first position
  if (pos1.length !== pos2.length || 
      pos1.includes(POSITION_SEPARATOR) || 
      pos2.includes(POSITION_SEPARATOR)) {
    return pos1 + POSITION_SEPARATOR + '1';
  }

  // Remove the 'a' prefix for calculation
  const num1 = parseInt(pos1.slice(1), 10);
  const num2 = parseInt(pos2.slice(1), 10);
  
  // Calculate midpoint
  const mid = Math.floor((num1 + num2) / 2);
  
  // If the midpoint is the same as the first number, we need to use separator
  if (mid === num1) {
    return pos1 + POSITION_SEPARATOR + '1';
  }
  
  // Format the midpoint with leading zeros
  return POSITION_BASE + mid.toString().padStart(INITIAL_SEGMENT_LENGTH, '0');
};

const generateSequentialPosition = (lastPosition: string): string => {
  // If the position contains a separator, append to it
  if (lastPosition.includes(POSITION_SEPARATOR)) {
    return lastPosition + '1';
  }

  // Remove the 'a' prefix and convert to number
  const currentNum = parseInt(lastPosition.slice(1), 10);
  const nextNum = currentNum + POSITION_INCREMENT;
  
  // Format with leading zeros
  return POSITION_BASE + nextNum.toString().padStart(INITIAL_SEGMENT_LENGTH, '0');
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
  
  // If no bullets exist or no current bullet specified, start with a0000
  if (!currentBulletId || allBullets.length === 0) {
    return POSITION_BASE.padEnd(INITIAL_SEGMENT_LENGTH + 1, '0');
  }

  const currentIndex = allBullets.findIndex(b => b.id === currentBulletId);
  if (currentIndex === -1) {
    console.error('Current bullet not found:', {
      currentBulletId,
      availableBullets: allBullets.map(b => b.id)
    });
    return POSITION_BASE.padEnd(INITIAL_SEGMENT_LENGTH + 1, '0');
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
  findBulletLevel
};