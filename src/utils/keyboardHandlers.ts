import { BulletPoint } from "@/types/bullet";

export const handleEnterKey = (
  e: React.KeyboardEvent,
  content: string,
  bullet: BulletPoint,
  onUpdate: (id: string, content: string) => void,
  onNewBullet: (id: string) => string | null
) => {
  e.preventDefault();
  
  console.log('Enter key pressed - Initial content:', content);
  
  // Get current selection and cursor position
  const selection = window.getSelection();
  const range = selection?.getRangeAt(0);
  const pos = range?.startOffset || 0;
  
  console.log('Cursor position:', pos);

  // Split content at cursor position
  const beforeCursor = content.slice(0, pos);
  const afterCursor = content.slice(pos);
  
  console.log('Content split:', { beforeCursor, afterCursor });

  setTimeout(() => {
    console.log('Updating original bullet with content:', beforeCursor);
    onUpdate(bullet.id, beforeCursor);
    
    console.log('Creating new bullet after:', bullet.id);
    const newBulletId = onNewBullet(bullet.id);
    
    console.log('New bullet created with ID:', newBulletId);
    
    if (newBulletId !== null) {
      setTimeout(() => {
        console.log('Looking for new bullet element with ID:', newBulletId);
        const newElement = document.querySelector(
          `[data-id="${newBulletId}"] .bullet-content`
        ) as HTMLElement;
        
        if (newElement) {
          console.log('Found new bullet element, focusing and updating content');
          newElement.focus();
          console.log('Setting new bullet content to:', afterCursor);
          onUpdate(newBulletId, afterCursor);
          
          console.log('Setting cursor position at start of new bullet');
          const range = document.createRange();
          const selection = window.getSelection();
          range.setStart(newElement, 0);
          range.collapse(true);
          selection?.removeAllRanges();
          selection?.addRange(range);
          console.log('Cursor position set');
        } else {
          console.warn('New bullet element not found in DOM');
        }
      }, 0);
    } else {
      console.warn('Failed to create new bullet');
    }
  }, 0);
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
