import { useState } from "react";
import { BulletPoint } from "@/types/bullet";

export const useBulletPath = (bullets: BulletPoint[]) => {
  const [breadcrumbPath, setBreadcrumbPath] = useState<{ id: string; content: string }[]>([]);
  const [currentBulletId, setCurrentBulletId] = useState<string | null>(null);

  const findBulletPath = (id: string | null, bullets: BulletPoint[]): BulletPoint[] => {
    if (!id) return [];
    
    for (const bullet of bullets) {
      if (bullet.id === id) {
        return [bullet];
      }
      const path = findBulletPath(id, bullet.children);
      if (path.length > 0) {
        return [bullet, ...path];
      }
    }
    return [];
  };

  const handleZoom = async (id: string | null) => {
    console.log('Zooming to bullet:', id);
    
    if (id === currentBulletId) {
      console.log('Already zoomed to this bullet, no change needed');
      return;
    }
    
    setCurrentBulletId(id);
    
    if (id) {
      const path = findBulletPath(id, bullets);
      console.log('Found bullet path:', path.map(b => ({
        id: b.id,
        content: b.content,
        level: b.level
      })));
      setBreadcrumbPath(path.map(b => ({ id: b.id, content: b.content })));
    } else {
      console.log('Returning to root level');
      setBreadcrumbPath([]);
    }
  };

  return {
    currentBulletId,
    breadcrumbPath,
    setBreadcrumbPath,
    findBulletPath,
    handleZoom
  };
};