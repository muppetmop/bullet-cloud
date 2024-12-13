import { useState, KeyboardEvent } from "react";
import { BulletPoint } from "@/types/bullet";

interface BulletHandlers {
  bullet: BulletPoint;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onNewBullet: (id: string) => string | null;
  onNavigate: (direction: "up" | "down", id: string) => void;
  onIndent?: (id: string) => void;
  onOutdent?: (id: string) => void;
}

interface PendingDelete {
  bulletId: string;
  previousContent: string;
  previousBulletId: string;
  cursorPosition: number;
}

interface PendingSplit {
  originalBulletId: string;
  beforeCursor: string;
  afterCursor: string;
}

export const useBulletHandlers = ({
  bullet,
  onUpdate,
  onDelete,
  onNewBullet,
  onNavigate,
  onIndent,
  onOutdent,
}: BulletHandlers) => {
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [pendingSplit, setPendingSplit] = useState<PendingSplit | null>(null);
  const [splitCompleted, setSplitCompleted] = useState(false);

  // Effect for handling content updates after split
  React.useEffect(() => {
    if (pendingSplit && !splitCompleted) {
      onUpdate(pendingSplit.originalBulletId, pendingSplit.beforeCursor);
      setSplitCompleted(true);
    }
  }, [pendingSplit, splitCompleted, onUpdate]);

  // Effect for creating new bullet after split
  React.useEffect(() => {
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

  // Effect for handling bullet deletion and cursor positioning
  React.useEffect(() => {
    if (pendingDelete) {
      onDelete(pendingDelete.bulletId);
      
      requestAnimationFrame(() => {
        const previousElement = document.querySelector(
          `[data-id="${pendingDelete.previousBulletId}"] .bullet-content`
        ) as HTMLElement;
        
        if (previousElement) {
          previousElement.focus();
          try {
            const selection = window.getSelection();
            const range = document.createRange();
            const textNode = previousElement.firstChild || previousElement;
            range.setStart(textNode, pendingDelete.cursorPosition);
            range.setEnd(textNode, pendingDelete.cursorPosition);
            selection?.removeAllRanges();
            selection?.addRange(range);
          } catch (err) {
            console.error('Failed to set cursor position:', err);
          }
        }
      });
      
      setPendingDelete(null);
    }
  }, [pendingDelete, onDelete]);

  const handleBackspace = (e: KeyboardEvent, content: string, pos: number) => {
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
                try {
                  const selection = window.getSelection();
                  const range = document.createRange();
                  const textNode = previousElement.firstChild || previousElement;
                  const position = previousContent.length;
                  range.setStart(textNode, position);
                  range.setEnd(textNode, position);
                  selection?.removeAllRanges();
                  selection?.addRange(range);
                } catch (err) {
                  console.error('Failed to set cursor position:', err);
                }
              });
            }
          } else {
            e.preventDefault();
            const cursorPosition = previousContent.length;
            onUpdate(previousBulletId, previousContent + content);
            setPendingDelete({ 
              bulletId: bullet.id, 
              previousContent: previousContent + content,
              previousBulletId,
              cursorPosition
            });
          }
        }
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const content = (e.target as HTMLElement).textContent || "";
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
      handleBackspace(e, content, pos);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      handleArrowKeys(e, content, bullet, onUpdate, onNavigate);
    }
  };

  return {
    handleKeyDown,
  };
};