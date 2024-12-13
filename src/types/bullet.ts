export interface BulletPoint {
  id: string;
  content: string;
  children: BulletPoint[];
  isCollapsed: boolean;
  parent_id: string | null;
  position: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}