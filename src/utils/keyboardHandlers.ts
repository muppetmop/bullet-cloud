import { BulletPoint } from "@/types/bullet";

export const handleEnterKey = (
  e: React.KeyboardEvent,
  content: string,
  bullet: BulletPoint,
  onUpdate: (id: string, content: string) => void,
  onNewBullet: (id: string) => string | null
) => {
  e.preventDefault();
  
  const selection = window.getSelection();
  const range = selection?.getRangeAt(0);
  const cursorPosition = range?.startOffset || 0;
  
  // If cursor is at the end, create empty bullet
  if (cursorPosition === content.length) {
    onUpdate(bullet.id, content);
    const newBulletId = onNewBullet(bullet.id);
    
    if (newBulletId !== null) {
      // Focus will be handled by the existing setTimeout in TaskManager
      return;
    }
  } else {
    // Split content at cursor position
    const contentBeforeCursor = content.slice(0, cursorPosition);
    const contentAfterCursor = content.slice(cursorPosition);
    
    // Update current bullet with content before cursor
    onUpdate(bullet.id, contentBeforeCursor);
    
    // Create new bullet and get its ID
    const newBulletId = onNewBullet(bullet.id);
    
    if (newBulletId !== null) {
      // Update the new bullet with content after cursor
      onUpdate(newBulletId, contentAfterCursor);
      
      setTimeout(() => {
        const newElement = document.querySelector(
          `[data-id="${newBulletId}"] .bullet-content`
        ) as HTMLElement;
        if (newElement) {
          newElement.focus();
          // Set cursor at the start of the new bullet
          const range = document.createRange();
          const selection = window.getSelection();
          range.setStart(newElement, 0);
          range.collapse(true);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }, 0);
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

export const handleBackspaceKey = (
  e: React.KeyboardEvent,
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
          
          // First update the previous bullet with merged content
          onUpdate(previousBulletId, previousContent + content);
          
          // Wait for the content to be merged before deleting
          setTimeout(() => {
            // Verify the content was merged successfully
            const updatedPreviousContent = previousElement.textContent || '';
            if (updatedPreviousContent === previousContent + content) {
              // Only delete if content was merged successfully
              if (bullet.children.length === 0) {
                onDelete(bullet.id);
              }
            }
          }, 50);
          
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
