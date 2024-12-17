import React from "react";
import { BulletPoint } from "@/types/bullet";
import BulletContent from "./bullet/BulletContent";

interface BulletItemProps {
  bullet: BulletPoint;
  level: number;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onNewBullet: (id: string) => Promise<string | null>;
  onCollapse: (id: string) => void;
  onNavigate: (direction: "up" | "down", id: string) => void;
  onIndent?: (id: string) => void;
  onOutdent?: (id: string) => void;
  onFocus: (id: string) => void;
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
  onFocus,
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
        onFocus={onFocus}
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
              onFocus={onFocus}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BulletItem;