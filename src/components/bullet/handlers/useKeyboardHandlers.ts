import { BulletPoint } from "@/types/bullet";
import { KeyboardEvent, RefObject } from "react";

interface KeyboardHandlerProps {
  contentRef: RefObject<HTMLDivElement>;
  bullet: BulletPoint;
  mode: "yours" | "theirs";
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onNewBullet: (id: string) => string | null;
  onIndent?: (id: string) => void;
  onOutdent?: (id: string) => void;
  onNavigate: (direction: "up" | "down", id: string) => void;
}

export const useKeyboardHandlers = ({
  contentRef,
  bullet,
  mode,
  onUpdate,
  onDelete,
  onNewBullet,
  onIndent,
  onOutdent,
  onNavigate,
}: KeyboardHandlerProps) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (mode === "theirs") return;
    
    const selection = window.getSelection();
    if (!selection) return;
    
    const range = selection.getRangeAt(0);
    const pos = range.startOffset;
    const content = contentRef.current?.textContent || "";

    if (e.key === "Enter") {
      if (e.shiftKey) {
        // Handle Shift+Enter for new line
        e.preventDefault();
        const textNode = contentRef.current?.firstChild || contentRef.current;
        if (!textNode) return;

        const beforeCursor = content.slice(0, pos);
        const afterCursor = content.slice(pos);
        
        // Insert newline character
        const newContent = beforeCursor + "\n" + afterCursor;
        if (contentRef.current) {
          contentRef.current.textContent = newContent;
        }
        
        // Update bullet content
        onUpdate(bullet.id, newContent);
        
        // Restore cursor position after the newline
        requestAnimationFrame(() => {
          const newRange = document.createRange();
          const newPos = pos + 1;
          newRange.setStart(textNode, newPos);
          newRange.setEnd(textNode, newPos);
          selection.removeAllRanges();
          selection.addRange(newRange);
        });
      } else {
        e.preventDefault();
        const beforeCursor = content.slice(0, pos);
        const afterCursor = content.slice(pos);
        
        onUpdate(bullet.id, beforeCursor);
        const newBulletId = onNewBullet(bullet.id);
        
        if (newBulletId) {
          requestAnimationFrame(() => {
            const newElement = document.querySelector(
              `[data-id="${newBulletId}"] .bullet-content`
            ) as HTMLElement;
            
            if (newElement) {
              newElement.textContent = afterCursor;
              onUpdate(newBulletId, afterCursor);
              newElement.focus();
              
              const selection = window.getSelection();
              const range = document.createRange();
              const textNode = newElement.firstChild || newElement;
              range.setStart(textNode, 0);
              range.setEnd(textNode, 0);
              selection?.removeAllRanges();
              selection?.addRange(range);
            }
          });
        }
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey && onOutdent) {
        onOutdent(bullet.id);
      } else if (!e.shiftKey && onIndent) {
        onIndent(bullet.id);
      }
      
      // Restore cursor position
      requestAnimationFrame(() => {
        const element = contentRef.current;
        if (element) {
          element.focus();
          const selection = window.getSelection();
          const range = document.createRange();
          const textNode = element.firstChild || element;
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
                  const selection = window.getSelection();
                  const range = document.createRange();
                  const textNode = previousElement.firstChild || previousElement;
                  const position = previousContent.length;
                  range.setStart(textNode, position);
                  range.setEnd(textNode, position);
                  selection?.removeAllRanges();
                  selection?.addRange(range);
                });
              }
            } else {
              e.preventDefault();
              onUpdate(previousBulletId, previousContent + content);
              
              setTimeout(() => {
                onDelete(bullet.id);
              }, 100);
              
              requestAnimationFrame(() => {
                previousElement.focus();
                const selection = window.getSelection();
                const range = document.createRange();
                const textNode = previousElement.firstChild || previousElement;
                const position = previousContent.length;
                range.setStart(textNode, position);
                range.setEnd(textNode, position);
                selection?.removeAllRanges();
                selection?.addRange(range);
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