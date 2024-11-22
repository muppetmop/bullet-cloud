import React, { useRef, KeyboardEvent } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { BulletPoint } from "@/types/bullet";

interface BulletItemProps {
  bullet: BulletPoint;
  level: number;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onIndent: (id: string) => void;
  onOutdent: (id: string) => void;
  onNewBullet: (id: string) => void;
  onCollapse: (id: string) => void;
  onNavigate: (direction: "up" | "down", id: string) => void;
}

const BulletItem: React.FC<BulletItemProps> = ({
  bullet,
  level,
  onUpdate,
  onDelete,
  onIndent,
  onOutdent,
  onNewBullet,
  onCollapse,
  onNavigate,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onNewBullet(bullet.id);
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        onOutdent(bullet.id);
      } else {
        onIndent(bullet.id);
      }
    } else if (e.key === "Backspace" && !bullet.content && !bullet.children.length) {
      e.preventDefault();
      onDelete(bullet.id);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onNavigate("up", bullet.id);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onNavigate("down", bullet.id);
    }
  };

  return (
    <div className="bullet-item" data-id={bullet.id}>
      <div className="flex items-start gap-1">
        {bullet.children.length > 0 ? (
          <button
            className="collapse-button mt-1"
            onClick={() => onCollapse(bullet.id)}
          >
            {bullet.isCollapsed ? (
              <ChevronRight className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        ) : (
          <span className="w-4 h-4 inline-flex items-center justify-center mt-1">•</span>
        )}
        <div
          ref={contentRef}
          className="bullet-content py-1"
          contentEditable
          onBlur={(e) => onUpdate(bullet.id, e.currentTarget.textContent || "")}
          onKeyDown={handleKeyDown}
          suppressContentEditableWarning
        >
          {bullet.content}
        </div>
      </div>
      {!bullet.isCollapsed && bullet.children.length > 0 && (
        <div className="bullet-children">
          {bullet.children.map((child) => (
            <BulletItem
              key={child.id}
              bullet={child}
              level={level + 1}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onIndent={onIndent}
              onOutdent={onOutdent}
              onNewBullet={onNewBullet}
              onCollapse={onCollapse}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BulletItem;