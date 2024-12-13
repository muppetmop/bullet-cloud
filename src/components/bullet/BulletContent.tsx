import React from "react";
import { BulletPoint } from "@/types/bullet";
import BulletIcon from "./BulletIcon";
import EditableContent from "./EditableContent";
import { useBulletHandlers } from "./useBulletHandlers";

interface BulletContentProps {
  bullet: BulletPoint;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onNewBullet: (id: string) => Promise<string | null>;
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
  const { handleKeyDown } = useBulletHandlers({
    bullet,
    onUpdate,
    onDelete,
    onNewBullet,
    onNavigate,
    onIndent,
    onOutdent,
  });

  const handleInput = () => {
    const content = document.querySelector(
      `[data-id="${bullet.id}"] .bullet-content`
    )?.textContent || "";
    onUpdate(bullet.id, content);
  };

  return (
    <div className="flex items-start gap-1">
      <BulletIcon
        hasChildren={bullet.children.length > 0}
        isCollapsed={bullet.isCollapsed}
        onCollapse={() => onCollapse(bullet.id)}
      />
      <EditableContent
        content={bullet.content}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

export default BulletContent;