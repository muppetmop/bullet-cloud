import React from "react";
import { BulletPoint } from "@/types/bullet";
import { useBulletDrag } from "./bullet/BulletDragHandlers";
import BulletContent from "./bullet/BulletContent";

interface BulletItemProps {
  bullet: BulletPoint;
  level: number;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onNewBullet: (id: string) => string | null;
  onCollapse: (id: string) => void;
  onNavigate: (direction: "up" | "down", id: string) => void;
  onIndent?: (id: string) => void;
  onOutdent?: (id: string) => void;
  onReorder: (draggedId: string, targetId: string, position: 'before' | 'after') => void;
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
  onReorder,
}) => {
  const {
    isDragging,
    dragRef,
    handleMouseDown,
    handleMouseUp,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
  } = useBulletDrag();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('drag-over-top', 'drag-over-bottom');
    
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId === bullet.id) return; 
    
    const rect = target.getBoundingClientRect();
    const midPoint = rect.top + rect.height / 2;
    const position = e.clientY < midPoint ? 'before' : 'after';
    
    onReorder(draggedId, bullet.id, position);
  };

  return (
    <div 
      className="bullet-item" 
      data-id={bullet.id}
      ref={dragRef}
      draggable={isDragging}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDragStart={(e) => handleDragStart(e, bullet.id)}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <BulletContent
        bullet={bullet}
        isDragging={isDragging}
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
              onReorder={onReorder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BulletItem;