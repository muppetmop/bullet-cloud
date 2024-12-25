import { useState, useRef, KeyboardEvent } from "react";
import { BulletPoint } from "@/types/bullet";

interface PendingSplit {
  originalBulletId: string;
  beforeCursor: string;
  afterCursor: string;
  children?: BulletPoint[];
  focusOriginal?: boolean;
}

interface KeyboardHandlerProps {
  bullet: BulletPoint;
  mode: "yours" | "theirs";
  contentRef: React.RefObject<HTMLDivElement>;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onIndent?: (id: string) => void;
  onOutdent?: (id: string) => void;
  onNavigate: (direction: "up" | "down", id: string) => void;
}

export const useKeyboardHandlers = ({
  bullet,
  mode,
  contentRef,
  onUpdate,
  onDelete,
  onIndent,
  onOutdent,
  onNavigate,
}: KeyboardHandlerProps) => {
  const [pendingSplit, setPendingSplit] = useState<PendingSplit | null>(null);
  const [splitCompleted, setSplitCompleted] = useState(false);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (mode === "theirs") return;
    
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
        children: bullet.children,
        focusOriginal: pos === 0 && afterCursor.length > 0
      });
    } else if (e.key === "Tab") {
      handleTabKey(e, content, bullet, pos, onUpdate, onIndent, onOutdent);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      handleArrowKeys(e, content, bullet, onUpdate, onNavigate);
    } else if (e.key === "Backspace") {
      handleBackspaceKey(e, content, bullet, pos, contentRef, onUpdate, onDelete);
    }
  };

  return {
    handleKeyDown,
    pendingSplit,
    setPendingSplit,
    splitCompleted,
    setSplitCompleted
  };
};

const handleTabKey = (
  e: KeyboardEvent,
  content: string,
  bullet: BulletPoint,
  pos: number,
  onUpdate: (id: string, content: string) => void,
  onIndent?: (id: string) => void,
  onOutdent?: (id: string) => void
) => {
  e.preventDefault();
  onUpdate(bullet.id, content);
  
  if (e.shiftKey && onOutdent) {
    onOutdent(bullet.id);
  } else if (!e.shiftKey && onIndent) {
    onIndent(bullet.id);
  }
};

const handleArrowKeys = (
  e: KeyboardEvent,
  content: string,
  bullet: BulletPoint,
  onUpdate: (id: string, content: string) => void,
  onNavigate: (direction: "up" | "down", id: string) => void
) => {
  e.preventDefault();
  onUpdate(bullet.id, content);
  onNavigate(e.key === "ArrowUp" ? "up" : "down", bullet.id);
};

const handleBackspaceKey = (
  e: KeyboardEvent,
  content: string,
  bullet: BulletPoint,
  pos: number,
  contentRef: React.RefObject<HTMLDivElement>,
  onUpdate: (id: string, content: string) => void,
  onDelete: (id: string) => void
) => {
  // Only handle backspace at the start of the line
  if (pos === 0) {
    // Get all visible bullet contents
    const visibleBullets = Array.from(
      document.querySelectorAll('.bullet-content')
    ) as HTMLElement[];
    
    // Find the current bullet's index
    const currentIndex = visibleBullets.findIndex(
      el => el === contentRef.current
    );
    
    // Only proceed if we're not at the first bullet
    if (currentIndex > 0) {
      e.preventDefault(); // Prevent default backspace behavior
      
      const previousElement = visibleBullets[currentIndex - 1];
      const previousContent = previousElement.textContent || '';
      const previousBulletId = previousElement.closest('[data-id]')?.getAttribute('data-id');
      
      if (previousBulletId) {
        if (content.length === 0) {
          // If current bullet is empty, delete it and move cursor to end of previous bullet
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
          // If current bullet has content, merge with previous bullet
          onUpdate(previousBulletId, previousContent + content);
          
          setTimeout(() => {
            onDelete(bullet.id);
          }, 100);
          
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
      }
    }
  }
};