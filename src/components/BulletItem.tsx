import React from "react";
import { BulletPoint } from "@/types/bullet";
import BulletContent from "./bullet/BulletContent";

interface BulletItemProps {
  bullet: BulletPoint;
  level: number;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onNewBullet: (id: string) => Promise<string>;  // Updated to handle Promise
  onCollapse: (id: string) => void;
  onNavigate: (direction: "up" | "down", currentId: string) => void;
  onIndent: (id: string) => void;
  onOutdent: (id: string) => void;
}

const BulletItem: React.FC<BulletItemProps> = ({
  bullet,
  level,
  onUpdate,
  onDelete,
  onNewBullet,
  onCollapse,
  onNavigate,
  onIndent,
  onOutdent,
}) => {
  return (
    <div 
      className="bullet-item" 
      data-id={bullet.id}
    >
      <BulletContent
        bullet={bullet}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onNewBullet={onNewBullet}
        onCollapse={onCollapse}
        onNavigate={onNavigate}
        onIndent={onIndent}
        onOutdent={onOutdent}
      />
      {!bullet.isCollapsed && bullet.children.length > 0 && (
        <div className="bullet-children">
          {bullet.children.map((child) => (
            <BulletItem
              key={child.id}
              bullet={child}
              level={level + 1}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onNewBullet={onNewBullet}
              onCollapse={onCollapse}
              onNavigate={onNavigate}
              onIndent={onIndent}
              onOutdent={onOutdent}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BulletItem;