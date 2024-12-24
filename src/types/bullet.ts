export interface BulletPoint {
  id: string;
  content: string;
  children: BulletPoint[];
  isCollapsed: boolean;
  position: number;  // Position from top to bottom when all bullets are expanded
  level: number;    // Nesting level (0 for root bullets, increases with nesting)
  parent_id: string | null;  // Updated to match database schema
}