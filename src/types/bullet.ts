export interface BulletPoint {
  id: string;
  content: string;
  children: BulletPoint[];
  isCollapsed: boolean;
  position: string;  // Changed from number to string
  level: number;
  parent_id?: string | null;
}