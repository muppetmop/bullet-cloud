import { KeyboardEvent } from "react";
import { BulletPoint } from "@/types/bullet";

interface KeyboardHandlerProps {
  contentRef: React.RefObject<HTMLDivElement>;
  bullet: BulletPoint;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onNewBullet: (id: string) => Promise<string | null>;
  onNavigate: (direction: "up" | "down", id: string) => void;
  onIndent?: (id: string) => void;
  onOutdent?: (id: string) => void;
  setPendingSplit: (split: { originalBulletId: string; beforeCursor: string; afterCursor: string; } | null) => void;
  setPendingDelete: (del: { bulletId: string; previousContent: string; previousBulletId: string; } | null) => void;
}

export const useKeyboardHandlers = ({
  contentRef,
  bullet,
  onUpdate,
  onDelete,
  onNewBullet,
  onNavigate,
  onIndent,
  onOutdent,
  setPendingSplit,
  setPendingDelete,
}: KeyboardHandlerProps) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const content = contentRef.current?.textContent || "";
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    const pos = range?.startOffset || 0;

    if (e.key === "Enter" && !e.isComposing && !e.shiftKey) {
      e.preventDefault();
      
      // Only proceed if there's no pending split
      if (!contentRef.current?.getAttribute('data-splitting')) {
        contentRef.current?.setAttribute('data-splitting', 'true');
        
        const beforeCursor = content.slice(0, pos);
        const afterCursor = content.slice(pos);
        
        setPendingSplit({
          originalBulletId: bullet.id,
          beforeCursor,
          afterCursor,
        });

        // Clear the splitting flag after a short delay
        setTimeout(() => {
          contentRef.current?.removeAttribute('data-splitting');
        }, 100);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      onUpdate(bullet.id, content);
      
      if (e.shiftKey && onOutdent) {
        onOutdent(bullet.id);
      } else if (!e.shiftKey && onIndent) {
        onIndent(bullet.id);
      }

      requestAnimationFrame(() => {
        if (contentRef.current) {
          contentRef.current.focus();
          const selection = window.getSelection();
          const range = document.createRange();
          const textNode = contentRef.current.firstChild || contentRef.current;
          range.setStart(textNode, pos);
          range.setEnd(textNode, pos);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      });
    } else if (e.key === "Backspace") {
      if (pos === 0) {
        const visibleBullets = Array.from(
          document.querySelectorAll('.bullet-content')
        ) as HTMLElement[];
        
        const currentIndex = visibleBullets.findIndex(
          el => el === contentRef.current
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
              setPendingDelete({ 
                bulletId: bullet.id, 
                previousContent: previousContent + content,
                previousBulletId
              });
            }
          }
        }
      }
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      onUpdate(bullet.id, content);
      onNavigate(e.key === "ArrowUp" ? "up" : "down", bullet.id);
    }
  };

  return { handleKeyDown };
};