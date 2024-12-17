import React from "react";
import { BulletPoint } from "@/types/bullet";
import BulletIcon from "./BulletIcon";
import EditableContent from "./EditableContent";

interface BulletContentProps {
  bullet: BulletPoint;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onNewBullet: (id: string) => string | null;
  onCollapse: (id: string) => void;
  onNavigate: (direction: "up" | "down", id: string) => void;
  onIndent?: (id: string) => void;
  onOutdent?: (id: string) => void;
}

const BulletContent: React.FC<BulletContentProps> = ({
  bullet,
  onUpdate,
  onDelete,
  onNewBullet,
  onCollapse,
  onNavigate,
  onIndent,
  onOutdent,
}) => {
  return (
    <div className="flex items-start gap-1">
      <BulletIcon
        hasChildren={bullet.children.length > 0}
        isCollapsed={bullet.isCollapsed}
        onCollapse={() => onCollapse(bullet.id)}
        onZoom={() => {
          window.location.hash = `#${bullet.id}`;
        }}
      />
      <EditableContent
        content={bullet.content}
        onUpdate={(content) => onUpdate(bullet.id, content)}
        onDelete={() => onDelete(bullet.id)}
        onNewBullet={() => onNewBullet(bullet.id)}
        onNavigate={(direction) => onNavigate(direction, bullet.id)}
        onIndent={onIndent ? () => onIndent(bullet.id) : undefined}
        onOutdent={onOutdent ? () => onOutdent(bullet.id) : undefined}
      />
    </div>
  );
};

export default BulletContent;