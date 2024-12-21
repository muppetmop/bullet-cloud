import React, { useCallback } from "react";
import { BulletPoint } from "@/types/bullet";
import CollapseButton from "./CollapseButton";
import BulletIcon from "./BulletIcon";
import EditableContent from "./EditableContent";
import { isTouchDevice } from "@/utils/deviceDetection";

interface BulletContentProps {
  bullet: BulletPoint;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onNewBullet: (id: string) => string | null;
  onCollapse: (id: string) => void;
  onNavigate: (direction: "up" | "down", id: string) => void;
  onIndent?: (id: string) => void;
  onOutdent?: (id: string) => void;
  onZoom: (id: string) => void;
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
  onZoom,
}) => {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const content = e.currentTarget.textContent || "";
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    const pos = range?.startOffset || 0;

    if (e.key === "Enter") {
      e.preventDefault();
      const beforeCursor = content.slice(0, pos);
      const afterCursor = content.slice(pos);
      
      onUpdate(bullet.id, beforeCursor);
      const newBulletId = onNewBullet(bullet.id);
      
      if (newBulletId) {
        onUpdate(newBulletId, afterCursor);
        requestAnimationFrame(() => {
          const newElement = document.querySelector(
            `[data-id="${newBulletId}"] .bullet-content`
          ) as HTMLElement;
          if (newElement) {
            newElement.focus();
            try {
              const selection = window.getSelection();
              const range = document.createRange();
              const textNode = newElement.firstChild || newElement;
              range.setStart(textNode, 0);
              range.setEnd(textNode, 0);
              selection?.removeAllRanges();
              selection?.addRange(range);
            } catch (err) {
              console.error('Failed to set cursor position:', err);
            }
          }
        });
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey && onOutdent) {
        onOutdent(bullet.id);
      } else if (!e.shiftKey && onIndent) {
        onIndent(bullet.id);
      }
    } else if (e.key === "Backspace" && !isTouchDevice()) {
      if (pos === 0) {
        const visibleBullets = Array.from(
          document.querySelectorAll('.bullet-content')
        ) as HTMLElement[];
        
        const currentIndex = visibleBullets.findIndex(
          el => el.textContent === content
        );
        
        if (currentIndex > 0) {
          const previousElement = visibleBullets[currentIndex - 1];
          const previousContent = previousElement.textContent || '';
          const previousBulletId = previousElement.closest('[data-id]')?.getAttribute('data-id');
          
          if (previousBulletId) {
            if (content.length === 0) {
              if (visibleBullets.length > 1 && bullet.children.length === 0) {
                onDelete(bullet.id);
                requestAnimationFrame(() => {
                  previousElement.focus();
                  try {
                    const selection = window.getSelection();
                    const range = document.createRange();
                    const textNode = previousElement.firstChild || previousElement;
                    range.setStart(textNode, previousContent.length);
                    range.setEnd(textNode, previousContent.length);
                    selection?.removeAllRanges();
                    selection?.addRange(range);
                  } catch (err) {
                    console.error('Failed to set cursor position:', err);
                  }
                });
              }
            } else {
              e.preventDefault();
              onUpdate(previousBulletId, previousContent + content);
              setTimeout(() => onDelete(bullet.id), 0);
              
              requestAnimationFrame(() => {
                previousElement.focus();
                try {
                  const selection = window.getSelection();
                  const range = document.createRange();
                  const textNode = previousElement.firstChild || previousElement;
                  range.setStart(textNode, previousContent.length);
                  range.setEnd(textNode, previousContent.length);
                  selection?.removeAllRanges();
                  selection?.addRange(range);
                } catch (err) {
                  console.error('Failed to set cursor position:', err);
                }
              });
            }
          }
        }
      }
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      onNavigate(e.key === "ArrowUp" ? "up" : "down", bullet.id);
    }
  }, [bullet, onUpdate, onDelete, onNewBullet, onNavigate, onIndent, onOutdent]);

  const handleContentUpdate = useCallback((content: string) => {
    onUpdate(bullet.id, content);
  }, [bullet.id, onUpdate]);

  return (
    <>
      {bullet.children.length > 0 && (
        <CollapseButton
          isCollapsed={bullet.isCollapsed}
          onCollapse={() => onCollapse(bullet.id)}
        />
      )}
      <div className="bullet-wrapper">
        <BulletIcon onZoom={() => onZoom(bullet.id)} />
        <EditableContent
          content={bullet.content}
          onUpdate={handleContentUpdate}
          onKeyDown={handleKeyDown}
        />
      </div>
    </>
  );
};

export default BulletContent;