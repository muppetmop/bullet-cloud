export interface BulletPoint {
  id: string;
  content: string;
  children: BulletPoint[];
  isCollapsed: boolean;
  treePathArray?: string[];
  depth?: number;
}