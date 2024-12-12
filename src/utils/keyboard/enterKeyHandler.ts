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
  
  // Case 1: Cursor at the end, create empty bullet
  if (cursorPosition === content.length) {
    // First ensure current bullet content is saved
    onUpdate(bullet.id, content);
    
    // Then create new bullet
    const newBulletId = onNewBullet(bullet.id);
    
    if (newBulletId !== null) {
      requestAnimationFrame(() => {
        const newElement = document.querySelector(
          `[data-id="${newBulletId}"] .bullet-content`
        ) as HTMLElement;
        if (newElement) {
          newElement.focus();
          const textNode = newElement.firstChild || newElement.appendChild(document.createTextNode(''));
          const range = document.createRange();
          const selection = window.getSelection();
          range.setStart(textNode, 0);
          range.collapse(true);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      });
    }
  } else {
    // Case 2: Split content at cursor position
    const contentBeforeCursor = content.slice(0, cursorPosition);
    const contentAfterCursor = content.slice(cursorPosition);
    
    // Update current bullet with content before cursor
    onUpdate(bullet.id, contentBeforeCursor);
    
    // Create new bullet and get its ID
    const newBulletId = onNewBullet(bullet.id);
    
    if (newBulletId !== null) {
      // Update new bullet with content after cursor
      requestAnimationFrame(() => {
        onUpdate(newBulletId, contentAfterCursor);
        
        // Focus on the current bullet after content update
        const currentElement = document.querySelector(
          `[data-id="${bullet.id}"] .bullet-content`
        ) as HTMLElement;
        
        if (currentElement) {
          currentElement.focus();
          try {
            const textNode = currentElement.firstChild || currentElement.appendChild(document.createTextNode(contentBeforeCursor));
            const range = document.createRange();
            const selection = window.getSelection();
            range.setStart(textNode, contentBeforeCursor.length);
            range.collapse(true);
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