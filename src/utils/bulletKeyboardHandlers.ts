import { KeyboardEvent } from "react";
import { BulletPoint } from "@/types/bullet";

export const isFirstChildInNestedLevel = (
  bullet: BulletPoint,
  visibleBullets: HTMLElement[]
): boolean => {
  // If level is 0, it's not a nested bullet
  if (bullet.level === 0) return false;

  const currentIndex = visibleBullets.findIndex(
    el => el.closest('[data-id]')?.getAttribute('data-id') === bullet.id
  );

  if (currentIndex <= 0) return false;

  // Get the previous bullet's element
  const previousElement = visibleBullets[currentIndex - 1];
  const previousBulletId = previousElement.closest('[data-id]')?.getAttribute('data-id');
  
  // Find the previous bullet in the data structure
  const findBullet = (bullets: BulletPoint[], id: string): BulletPoint | null => {
    for (const b of bullets) {
      if (b.id === id) return b;
      const found = findBullet(b.children, id);
      if (found) return found;
    }
    return null;
  };

  // If we can't find the previous bullet, return false
  if (!previousBulletId) return false;

  // Get the previous bullet's level
  const previousBullet = findBullet([], previousBulletId); // You'll need to pass the actual bullets array
  if (!previousBullet) return false;

  // If the current bullet's level is higher than the previous bullet's level,
  // it means this is the first child in a nested level
  return bullet.level > previousBullet.level;
};

export const handleBackspaceKey = (
  e: KeyboardEvent,
  content: string,
  bullet: BulletPoint,
  pos: number,
  contentRef: React.RefObject<HTMLDivElement>,
  onUpdate: (id: string, content: string) => void,
  onDelete: (id: string) => void
) => {
  const selection = window.getSelection();
  
  // If there's selected text, let the default behavior handle it
  if (selection && !selection.isCollapsed) {
    return;
  }
  
  // Only handle backspace at the start of the line
  if (pos === 0) {
    const visibleBullets = Array.from(
      document.querySelectorAll('.bullet-content')
    ) as HTMLElement[];
    
    // Check if this is the first child in a nested level
    if (isFirstChildInNestedLevel(bullet, visibleBullets)) {
      // Prevent default behavior for first child in nested level
      e.preventDefault();
      return;
    }
    
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

export const handleTabKey = (
  e: React.KeyboardEvent,
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

export const handleArrowKeys = (
  e: React.KeyboardEvent,
  content: string,
  bullet: BulletPoint,
  onUpdate: (id: string, content: string) => void,
  onNavigate: (direction: "up" | "down", id: string) => void
) => {
  e.preventDefault();
  onUpdate(bullet.id, content);
  onNavigate(e.key === "ArrowUp" ? "up" : "down", bullet.id);
};
