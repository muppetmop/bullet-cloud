import React, { useRef, KeyboardEvent, useEffect, useState } from "react";
import { ChevronRight, ChevronDown, GripVertical } from "lucide-react";
import { BulletPoint } from "@/types/bullet";

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
  const contentRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const dragRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.textContent = bullet.content;
  }, [bullet.content]);

  const handleMouseDown = () => {
    longPressTimer.current = setTimeout(() => {
      if (dragRef.current) {
        dragRef.current.draggable = true;
        setIsDragging(true);
      }
    }, 300); // Reduced from 500ms to 300ms
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', bullet.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    if (dragRef.current) {
      dragRef.current.draggable = false;
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const target = e.currentTarget as HTMLElement;
    
    // Add visual feedback for drag position
    const rect = target.getBoundingClientRect();
    const midPoint = rect.top + rect.height / 2;
    
    if (e.clientY < midPoint) {
      target.classList.add('drag-over-top');
      target.classList.remove('drag-over-bottom');
    } else {
      target.classList.add('drag-over-bottom');
      target.classList.remove('drag-over-top');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('drag-over-top', 'drag-over-bottom');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('drag-over-top', 'drag-over-bottom');
    
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId === bullet.id) return; // Can't drop on itself
    
    // TODO: Implement the actual reordering logic in useBulletManager
    console.log('Dropped', draggedId, 'onto', bullet.id);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const content = contentRef.current?.textContent || "";
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);

    if (e.key === "Enter") {
      e.preventDefault();
      onUpdate(bullet.id, content);
      const newBulletId = onNewBullet(bullet.id);
      if (newBulletId !== null) {
        setTimeout(() => {
          const newElement = document.querySelector(
            `[data-id="${newBulletId}"] .bullet-content`
          ) as HTMLElement;
          if (newElement) {
            newElement.focus();
          }
        }, 0);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const pos = range?.startOffset || 0;
      onUpdate(bullet.id, content);
      
      if (e.shiftKey && onOutdent) {
        onOutdent(bullet.id);
        setTimeout(() => {
          const element = document.querySelector(
            `[data-id="${bullet.id}"] .bullet-content`
          ) as HTMLElement;
          if (element) {
            element.focus();
            try {
              const range = document.createRange();
              const selection = window.getSelection();
              const textNode = element.firstChild || element;
              range.setStart(textNode, pos);
              range.setEnd(textNode, pos);
              selection?.removeAllRanges();
              selection?.addRange(range);
            } catch (err) {
              console.error('Failed to restore cursor position:', err);
            }
          }
        }, 0);
      } else if (!e.shiftKey && onIndent) {
        onIndent(bullet.id);
        setTimeout(() => {
          const element = document.querySelector(
            `[data-id="${bullet.id}"] .bullet-content`
          ) as HTMLElement;
          if (element) {
            element.focus();
            try {
              const range = document.createRange();
              const selection = window.getSelection();
              const textNode = element.firstChild || element;
              range.setStart(textNode, pos);
              range.setEnd(textNode, pos);
              selection?.removeAllRanges();
              selection?.addRange(range);
            } catch (err) {
              console.error('Failed to restore cursor position:', err);
            }
          }
        }, 0);
      }
    } else if (e.key === "Backspace" && !content && !bullet.children.length) {
      e.preventDefault();
      onDelete(bullet.id);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onUpdate(bullet.id, content);
      onNavigate("up", bullet.id);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onUpdate(bullet.id, content);
      onNavigate("down", bullet.id);
    }
  };

  const handleInput = () => {
    const content = contentRef.current?.textContent || "";
    onUpdate(bullet.id, content);
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
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
          <span className="w-4 h-4 inline-flex items-center justify-center mt-1">
            •
          </span>
        )}
        <div
          ref={contentRef}
          className="bullet-content py-1"
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          suppressContentEditableWarning
        />
        {isDragging && (
          <GripVertical className="w-6 h-6 text-gray-400 ml-2" />
        )}
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BulletItem;
