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
  if (!selection?.rangeCount) return;
  
  const range = selection.getRangeAt(0);
  const pos = range.startOffset;
  
  console.log('Enter pressed:', {
    bulletId: bullet.id,
    originalContent: content,
    cursorPosition: pos
  });

  // Split content at cursor position
  const beforeCursor = content.slice(0, pos);
  const afterCursor = content.slice(pos);
  
  console.log('Content split:', {
    beforeCursor,
    afterCursor,
    bulletId: bullet.id
  });

  // First, update the current bullet with content before cursor
  onUpdate(bullet.id, beforeCursor);
  
  // Create new bullet and get its ID
  const newBulletId = onNewBullet(bullet.id);
  
  console.log('New bullet created:', {
    originalBulletId: bullet.id,
    newBulletId,
    contentToMove: afterCursor
  });

  if (newBulletId) {
    // Update the new bullet with content after cursor
    onUpdate(newBulletId, afterCursor);
    
    // Focus the new bullet
    requestAnimationFrame(() => {
      const newElement = document.querySelector(
        `[data-id="${newBulletId}"] .bullet-content`
      ) as HTMLElement;
      
      if (newElement) {
        newElement.focus();
        
        // Set cursor at the start of the new bullet
        const range = document.createRange();
        const selection = window.getSelection();
        
        // If there's content, set cursor at start of content
        if (newElement.firstChild) {
          range.setStart(newElement.firstChild, 0);
        } else {
          // If no content, create empty text node
          const textNode = document.createTextNode('');
          newElement.appendChild(textNode);
          range.setStart(textNode, 0);
        }
        
        range.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    });
  }
};