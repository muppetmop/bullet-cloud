import React from 'react';
import { BulletPoint } from "@/types/bullet";
import { useBulletManager } from "@/hooks/useBulletManager";
import { useBulletNavigation } from "@/hooks/useBulletNavigation";
import { findBulletPath } from "@/utils/bulletOperations";

interface BulletStateManagerProps {
  currentBulletId: string | null;
  mode: "yours" | "theirs";
  bullets: BulletPoint[];
  onBulletUpdate: (id: string, content: string) => void;
  onBulletDelete: (id: string) => void;
  onNewBullet: (id: string) => Promise<string>;
  onCollapse: (id: string) => void;
  onNavigate: (direction: "up" | "down", id: string) => void;
  onIndent: (id: string) => void;
  onOutdent: (id: string) => void;
  onZoom: (id: string) => void;
  onTransferChildren: (fromBulletId: string, toBulletId: string) => void;
}

const BulletStateManager: React.FC<BulletStateManagerProps> = ({
  currentBulletId,
  mode,
  bullets,
  onBulletUpdate,
  onBulletDelete,
  onNewBullet,
  onCollapse,
  onNavigate,
  onIndent,
  onOutdent,
  onZoom,
  onTransferChildren
}) => {
  const getVisibleBullets = () => {
    if (!currentBulletId) return bullets;
    
    const path = findBulletPath(currentBulletId, bullets);
    if (path.length > 0) {
      const currentBullet = path[path.length - 1];
      return currentBullet.children;
    }
    return [];
  };

  const visibleBullets = getVisibleBullets();

  return (
    <div className="space-y-4">
      {visibleBullets.map((bullet) => (
        <BulletItem
          key={bullet.id}
          bullet={bullet}
          level={0}
          onUpdate={onBulletUpdate}
          onDelete={onBulletDelete}
          onNewBullet={onNewBullet}
          onCollapse={onCollapse}
          onNavigate={onNavigate}
          onIndent={onIndent}
          onOutdent={onOutdent}
          onZoom={onZoom}
          mode={mode}
          onTransferChildren={onTransferChildren}
        />
      ))}
    </div>
  );
};

export default BulletStateManager;