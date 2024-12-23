import { KeyboardEvent } from "react";
import { BulletPoint } from "@/types/bullet";

interface KeyboardHandlerProps {
  bullet: BulletPoint;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onNewBullet: (id: string) => string | null;
  onNavigate: (direction: "up" | "down", id: string) => void;
  onIndent?: (id: string) => void;
  onOutdent?: (id: string) => void;
}

export const useKeyboardHandlers = ({
  bullet,
  onUpdate,
  onDelete,
  onNewBullet,
  onNavigate,
  onIndent,
  onOutdent,
}: KeyboardHandlerProps) => {
  const handleEnterKey = (e: KeyboardEvent, content: string, pos: number) => {
    if (e.shiftKey) {
      // Allow default behavior for Shift+Enter to create a new line
      // The cursor position will be handled by the browser
      return;
    }
    
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
  };

  const handleTabKey = (
    e: KeyboardEvent,
    content: string,
    pos: number
  ) => {
    e.preventDefault();
    onUpdate(bullet.id, content);
    
    if (e.shiftKey && onOutdent) {
      onOutdent(bullet.id);
    } else if (!e.shiftKey && onIndent) {
      onIndent(bullet.id);
    }

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
  };

  const handleBackspaceKey = (
    e: KeyboardEvent,
    content: string,
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
            e.preventDefault();
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

  return {
    handleEnterKey,
    handleTabKey,
    handleBackspaceKey,
    handleArrowKeys,
  };
};
