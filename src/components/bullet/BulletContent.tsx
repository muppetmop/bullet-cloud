import React, { useState } from "react";
import { BulletPoint } from "@/types/bullet";
import { handleTabKey, handleArrowKeys } from "@/utils/keyboardHandlers";
import CollapseButton from "./CollapseButton";
import BulletIcon from "./BulletIcon";
import ContentEditor from "./ContentEditor";
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
  const [splitCompleted, setSplitCompleted] = useState(false);
  const isTouch = isTouchDevice();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const content = e.currentTarget.textContent || "";
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    const pos = range?.startOffset || 0;

    if (e.key === "Enter") {
      e.preventDefault();
      const beforeCursor = content.slice(0, pos);
      const afterCursor = content.slice(pos);
      
      // Update current bullet with content before cursor
      onUpdate(bullet.id, beforeCursor);
      
      // Create new bullet with content after cursor
      const newBulletId = onNewBullet(bullet.id);
      if (newBulletId) {
        onUpdate(newBulletId, afterCursor);
        setSplitCompleted(true);
        
        // Focus new bullet after render
        requestAnimationFrame(() => {
          const newElement = document.querySelector(
            `[data-id="${newBulletId}"] .bullet-content`
          ) as HTMLElement;
          if (newElement) {
            newElement.focus();
          }
        });
      }
    } else if (e.key === "Tab") {
      handleTabKey(e, content, bullet, pos, onUpdate, onIndent, onOutdent);
    } else if (e.key === "Backspace" && !isTouch) {
      // Only handle backspace manually on desktop
      handleBackspaceOnDesktop(e, content, pos);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      handleArrowKeys(e, content, bullet, onUpdate, onNavigate);
    }
  };

  const handleBackspaceOnDesktop = (e: React.KeyboardEvent, content: string, pos: number) => {
    if (pos === 0) {
      const visibleBullets = Array.from(
        document.querySelectorAll('.bullet-content')
      ) as HTMLElement[];
      
      const currentIndex = visibleBullets.findIndex(
        el => el === e.currentTarget
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
              });
            }
          } else {
            e.preventDefault();
            onUpdate(previousBulletId, previousContent + content);
            onDelete(bullet.id);
            requestAnimationFrame(() => {
              previousElement.focus();
            });
          }
        }
      }
    }
  };

  return (
    <>
      <CollapseButton 
        isCollapsed={bullet.isCollapsed}
        hasChildren={bullet.children.length > 0}
        onCollapse={() => onCollapse(bullet.id)}
      />
      <div className="bullet-wrapper">
        <BulletIcon onZoom={() => onZoom(bullet.id)} />
        <ContentEditor
          content={bullet.content}
          onUpdate={(content) => onUpdate(bullet.id, content)}
          onKeyDown={handleKeyDown}
        />
      </div>
    </>
  );
};

export default BulletContent;