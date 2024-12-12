import { BulletPoint } from "@/types/bullet";

export const handleEnterKey = (
  e: React.KeyboardEvent,
  content: string,
  bullet: BulletPoint,
  onUpdate: (id: string, content: string) => void,
  onNewBullet: (id: string) => string | null
) => {
  e.preventDefault();
  onUpdate(bullet.id, content);
  const newBulletId = onNewBullet(bullet.id);
  if (newBulletId !== null) {
    setTimeout(() => {
      const newElement = document.querySelector(
        `[data-id="${newBulletId}"] .bullet-content`
      ) as HTMLElement;
      if (newElement) {
        newElement.focus();
      }
    }, 0);
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
    e.preventDefault();
    
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
      
      // Get the previous bullet's content and ID
      const previousContent = previousElement.textContent || '';
      const previousBulletId = previousElement.closest('[data-id]')?.getAttribute('data-id');
      
      // Only proceed if we found the previous bullet's ID
      if (previousBulletId) {
        // If there's content in the current bullet, merge it with the previous bullet
        if (content) {
          console.log('Merging content:', { previousContent, content });
          onUpdate(previousBulletId, previousContent + content);
        }
        
        // Delete the current bullet only if it's not the last remaining bullet
        if (visibleBullets.length > 1) {
          onDelete(bullet.id);
          
          // Set focus and cursor position after the DOM updates
          requestAnimationFrame(() => {
            previousElement.focus();
            
            try {
              const selection = window.getSelection();
              const range = document.createRange();
              
              // Get the text node (or the element itself if no text node exists)
              const textNode = previousElement.firstChild || previousElement;
              const position = previousContent.length;
              
              // Set the cursor position at the merge point
              range.setStart(textNode, position);
              range.setEnd(textNode, position);
              
              selection?.removeAllRanges();
              selection?.addRange(range);
              
              console.log('Cursor position set at:', position);
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
