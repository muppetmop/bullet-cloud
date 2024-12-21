import React, { useState } from "react";
import { BulletPoint } from "@/types/bullet";
import CollapseButton from "./CollapseButton";
import BulletIcon from "./BulletIcon";
import ContentEditor from "./ContentEditor";
import {
  handleTabKey,
  handleArrowKeys,
} from "@/utils/keyboardHandlers";

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
  const [pendingDelete, setPendingDelete] = useState<{
    bulletId: string;
    previousContent: string;
    previousBulletId: string;
  } | null>(null);

  const [pendingSplit, setPendingSplit] = useState<{
    originalBulletId: string;
    beforeCursor: string;
    afterCursor: string;
  } | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const content = e.currentTarget.textContent || "";
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    const pos = range?.startOffset || 0;

    if (e.key === "Enter") {
      e.preventDefault();
      const beforeCursor = content.slice(0, pos);
      const afterCursor = content.slice(pos);
      
      setPendingSplit({
        originalBulletId: bullet.id,
        beforeCursor,
        afterCursor,
      });

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
          }
        });
      }
    } else if (e.key === "Tab") {
      handleTabKey(e, content, bullet, pos, onUpdate, onIndent, onOutdent);
    } else if (e.key === "Backspace" && pos === 0) {
      handleBackspace(e, content);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      handleArrowKeys(e, content, bullet, onUpdate, onNavigate);
    }
  };

  const handleBackspace = (e: React.KeyboardEvent, content: string) => {
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
          setPendingDelete({ 
            bulletId: bullet.id, 
            previousContent: previousContent + content,
            previousBulletId
          });
          
          requestAnimationFrame(() => {
            previousElement.focus();
          });
        }
      }
    }
  };

  const handleContentUpdate = (newContent: string) => {
    onUpdate(bullet.id, newContent);
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
          onUpdate={handleContentUpdate}
          onKeyDown={handleKeyDown}
        />
      </div>
    </>
  );
};

export default BulletContent;