import { BulletPoint } from "@/types/bullet";
import { findNextPosition } from "../positionCalculator";

const createTestBullet = (
  id: string,
  position: string,
  content: string = "",
  userId: string = "test-user"
): BulletPoint => ({
  id,
  content,
  position,
  children: [],
  isCollapsed: false,
  level: 0,
  parent_id: null,
  user_id: userId
});

export const testPositionCalculator = () => {
  // Test sequential additions
  console.group("Testing sequential bullet additions");
  const sequentialBullets: BulletPoint[] = [];
  
  // First bullet
  const pos1 = findNextPosition(sequentialBullets);
  console.log("First bullet position:", pos1); // Expected: a0.0000
  sequentialBullets.push(createTestBullet("1", pos1, "1"));
  
  // Second bullet
  const pos2 = findNextPosition(sequentialBullets);
  console.log("Second bullet position:", pos2); // Expected: a1.0000
  sequentialBullets.push(createTestBullet("2", pos2, "2"));
  
  // Third bullet
  const pos3 = findNextPosition(sequentialBullets);
  console.log("Third bullet position:", pos3); // Expected: a2.0000
  sequentialBullets.push(createTestBullet("3", pos3, "3"));
  console.groupEnd();

  // Test insertions between bullets
  console.group("Testing insertions between bullets");
  
  // Insert between 1 and 2 (should be 1.5000)
  const between1and2 = findNextPosition(sequentialBullets, "1");
  console.log("Position between 1 and 2:", between1and2);
  
  const bullets2 = [...sequentialBullets];
  bullets2.splice(1, 0, createTestBullet("1.5", between1and2, "1.5"));
  
  // Insert between 1 and 1.5 (should be 1.2500)
  const betweenAgain = findNextPosition(bullets2, "1");
  console.log("Position between 1 and 1.5:", betweenAgain);
  
  return {
    sequentialPositions: [pos1, pos2, pos3],
    betweenPositions: [between1and2, betweenAgain]
  };
};