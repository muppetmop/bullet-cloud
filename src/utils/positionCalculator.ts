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
  
  return POSITION_BASE + midpoint.toFixed(4);
};

const extractPositionNumber = (position: string): number => {
  const match = position.match(/a(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

const generateSequentialPosition = (lastPosition: string): string => {
  const currentNum = extractPositionNumber(lastPosition);
  const nextNum = currentNum + 1;
  return POSITION_BASE + nextNum.toString() + '.0000';
};

const findNextPosition = (bullets: BulletPoint[], currentBulletId: string | null = null): string => {
  console.log('Finding next position:', { 
    currentBulletId,
    allBullets: bullets.map(b => ({
      id: b.id,
      content: b.content,
      position: b.position,
      level: b.level,
      parent_id: b.parent_id
    }))
  });
  
  // If no current bullet specified, start with a1.0000
  if (!currentBulletId) {
    return POSITION_BASE + '1.0000';
  }

  const currentBullet = bullets.find(b => b.id === currentBulletId);
  if (!currentBullet) {
    console.error('Current bullet not found:', {
      currentBulletId,
      availableBullets: bullets.map(b => b.id)
    });
    return POSITION_BASE + '1.0000';
  }

  // Get siblings (bullets at the same level with the same parent)
  const siblings = bullets.filter(b => 
    b.level === currentBullet.level && 
    b.parent_id === currentBullet.parent_id
  ).sort((a, b) => a.position.localeCompare(b.position));

  console.log('Found siblings:', {
    bulletId: currentBulletId,
    level: currentBullet.level,
    parentId: currentBullet.parent_id,
    siblings: siblings.map(s => ({
      id: s.id,
      position: s.position,
      content: s.content
    }))
  });

  const currentIndex = siblings.findIndex(b => b.id === currentBulletId);
  const nextSibling = siblings[currentIndex + 1];
  
  // If there's no next sibling, generate sequential position based on last sibling
  if (!nextSibling) {
    const lastSibling = siblings[siblings.length - 1];
    const newPosition = lastSibling ? 
      generateSequentialPosition(lastSibling.position) : 
      POSITION_BASE + '1.0000';
    
    console.log('Generated sequential position:', {
      lastSiblingPosition: lastSibling?.position,
      newPosition,
      reason: 'No next sibling'
    });
    
    return newPosition;
  }

  // Calculate position between current and next bullet
  const midpointPosition = calculateMidpoint(currentBullet.position, nextSibling.position);
  console.log('Calculated midpoint position:', {
    currentPosition: currentBullet.position,
    nextPosition: nextSibling.position,
    midpointPosition
  });
  
  return midpointPosition;
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