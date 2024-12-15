export interface BulletPoint {
  id: string;
  content: string;
  children: BulletPoint[];
  isCollapsed: boolean;
  absolutePosition: number;
  levelPosition: number;
  parent_id: string | null;
}