export interface BulletPoint {
  id: string;
  content: string;
  children: BulletPoint[];
  isCollapsed: boolean;
  position: string;
  level: number;
  parent_id?: string | null;
  user_id: string;
}