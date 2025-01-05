import { findNextPosition } from "../positionCalculator";
import { BulletPoint } from "@/types/bullet";

const createTestBullet = (
  id: string,
  position: string,
  content: string = ""
): BulletPoint => ({
  id,
  content,
  position,
  children: [],
  isCollapsed: false,
  level: 0,
  parent_id: null,
  user_id: "test-user"
});

export const testPositionCalculator = () => {
  // Test sequential additions
  console.group("Testing sequential bullet additions");
  const sequentialBullets: BulletPoint[] = [];
  
  // First bullet
  const pos1 = findNextPosition(sequentialBullets);
  console.log("First bullet position:", pos1); // Expected: a0000
  sequentialBullets.push(createTestBullet("1", pos1));
  
  // Second bullet
  const pos2 = findNextPosition(sequentialBullets);
  console.log("Second bullet position:", pos2); // Expected: a0001
  sequentialBullets.push(createTestBullet("2", pos2));
  
  // Third bullet
  const pos3 = findNextPosition(sequentialBullets);
  console.log("Third bullet position:", pos3); // Expected: a0002
  sequentialBullets.push(createTestBullet("3", pos3));
  console.groupEnd();

  // Test insertions between bullets
  console.group("Testing insertions between bullets");
  const between1and2 = findNextPosition(sequentialBullets, "1");
  console.log("Position between first and second:", between1and2); // Expected: a00005
  
  const bullets2 = [...sequentialBullets];
  bullets2.push(createTestBullet("1.5", between1and2));
  
  const betweenAgain = findNextPosition(bullets2, "1");
  console.log("Another position between first and middle:", betweenAgain); // Expected: a000025
  console.groupEnd();

  return {
    sequentialPositions: [pos1, pos2, pos3],
    betweenPositions: [between1and2, betweenAgain]
  };
};