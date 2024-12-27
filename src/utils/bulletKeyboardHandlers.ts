import { BulletPoint } from "@/types/bullet";

export const handleEnterKey = (
  e: React.KeyboardEvent,
  content: string,
  bullet: BulletPoint,
  pos: number,
  onUpdate: (id: string, content: string) => void,
  onNewBullet: (id: string) => string | null,
  contentRef: React.RefObject<HTMLDivElement>
) => {
  e.preventDefault();
  
  // If cursor is at start and there's content after
  if (pos === 0 && content.length > 0) {
    const afterCursor = content;
    
    // Clear original bullet
    onUpdate(bullet.id, "");
    
    // Create new bullet with content after cursor
    const newBulletId = onNewBullet(bullet.id);
    
    if (newBulletId) {
      // Update new bullet with content after cursor
      onUpdate(newBulletId, afterCursor);
      
      // Focus back on original (now empty) bullet
      requestAnimationFrame(() => {
        if (contentRef.current) {
          contentRef.current.focus();
          try {
            const selection = window.getSelection();
            const range = document.createRange();
            range.setStart(contentRef.current, 0);
            range.setEnd(contentRef.current, 0);
            selection?.removeAllRanges();
            selection?.addRange(range);
          } catch (err) {
            console.error('Failed to set cursor position:', err);
          }
        }
      });
    }
  } else {
    // Regular enter behavior - create new bullet and move cursor there
    onUpdate(bullet.id, content);
    const newBulletId = onNewBullet(bullet.id);
    
    if (newBulletId) {
      requestAnimationFrame(() => {
        const newElement = document.querySelector(
          `[data-id="${newBulletId}"] .bullet-content`
        ) as HTMLElement;
        if (newElement) {
          newElement.focus();
          try {
            const selection = window.getSelection();
            const range = document.createRange();
            range.setStart(newElement, 0);
            range.setEnd(newElement, 0);
            selection?.removeAllRanges();
            selection?.addRange(range);
          } catch (err) {
            console.error('Failed to set cursor position:', err);
          }
        }
      });
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
