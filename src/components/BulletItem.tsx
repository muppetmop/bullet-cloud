import React from "react";
import { BulletPoint } from "@/types/bullet";
import BulletContent from "./bullet/BulletContent";
import { useDrag } from "@/contexts/DragContext";

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
  onZoom: (id: string) => void;
  mode?: "yours" | "theirs";
  onTransferChildren?: (fromBulletId: string, toBulletId: string) => void;
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
  onZoom,
  mode = "yours",
  onTransferChildren
}) => {
  const { draggedId, dragOverId, setDraggedId, setDragOverId, setDragLevel } = useDrag();
  const isDragging = draggedId === bullet.id;
  const isOver = dragOverId === bullet.id;

  const handleDragStart = (e: React.DragEvent) => {
    if (mode !== "yours") return;
    e.dataTransfer.setData('text/plain', bullet.id);
    setDraggedId(bullet.id);
    setDragLevel(bullet.level);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (mode !== "yours") return;
    e.preventDefault();
    if (draggedId !== bullet.id) {
      setDragOverId(bullet.id);
    }
  };

  const handleDragEnd = () => {
    if (mode !== "yours") return;
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div 
      className="bullet-item" 
      data-id={bullet.id}
      data-position={bullet.position}
    >
      <div
        draggable={mode === "yours"}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        className={`relative ${isDragging ? 'opacity-50' : ''} ${isOver ? 'border-t-2 border-blue-500' : ''}`}
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
          onZoom={onZoom}
          mode={mode}
          onTransferChildren={onTransferChildren}
        />
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
      )}
    </div>
  );
};

export default BulletItem;