import React, { useRef, KeyboardEvent, useEffect, useState } from "react";
import { BulletPoint } from "@/types/bullet";
import BulletIcon from "./BulletIcon";
import { handleBackspaceKey } from "@/utils/bulletKeyboardHandlers";
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
}

interface PendingSplit {
  originalBulletId: string;
  beforeCursor: string;
  afterCursor: string;
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
  const contentRef = useRef<HTMLDivElement>(null);
  const [pendingSplit, setPendingSplit] = useState<PendingSplit | null>(null);
  const [splitCompleted, setSplitCompleted] = useState(false);

  useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.textContent = bullet.content;
  }, [bullet.content]);

  useEffect(() => {
    if (pendingSplit && !splitCompleted) {
      onUpdate(pendingSplit.originalBulletId, pendingSplit.beforeCursor);
      setSplitCompleted(true);
    }
  }, [pendingSplit, splitCompleted, onUpdate]);

  useEffect(() => {
    if (pendingSplit && splitCompleted) {
      const newBulletId = onNewBullet(pendingSplit.originalBulletId);
      
      if (newBulletId) {
        onUpdate(newBulletId, pendingSplit.afterCursor);

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

        setPendingSplit(null);
        setSplitCompleted(false);
      }
    }
  }, [pendingSplit, splitCompleted, onNewBullet, onUpdate]);

  const handleKeyDown = (e: KeyboardEvent) => {
    const content = contentRef.current?.textContent || "";
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
    } else if (e.key === "Tab") {
      handleTabKey(e, content, bullet, pos, onUpdate, onIndent, onOutdent);
    } else if (e.key === "Backspace") {
      handleBackspaceKey(e, content, bullet, pos, contentRef, onUpdate, onDelete);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      handleArrowKeys(e, content, bullet, onUpdate, onNavigate);
    }
  };

  const handleInput = () => {
    const content = contentRef.current?.textContent || "";
    onUpdate(bullet.id, content);
  };

  return (
    <div className="flex items-start">
      <div className="flex items-end gap-1 mr-1 pb-[3px]">
        <BulletIcon
          hasChildren={bullet.children.length > 0}
          isCollapsed={bullet.isCollapsed}
          onCollapse={() => onCollapse(bullet.id)}
        />
      </div>
      <div className="flex items-start gap-1 flex-grow">
        <span className="w-4 h-4 inline-flex items-center justify-center">
          •
        </span>
        <div
          ref={contentRef}
          className="bullet-content py-1"
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          suppressContentEditableWarning
        />
      </div>
    </div>
  );
};

export default BulletContent;