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
    const contentAfterCursor = content.slice(cursorPosition);
    
    // First update current bullet with hardcoded content
    console.log('Updating original bullet:', bullet.id, 'with content: god damn it');
    onUpdate(bullet.id, "god damn it");
    
    // Create new bullet and get its ID
    const newBulletId = onNewBullet(bullet.id);
    
    if (newBulletId !== null) {
      console.log('Updating new bullet:', newBulletId, 'with content:', contentAfterCursor);
      
      // Update new bullet with content after cursor and verify the update
      onUpdate(newBulletId, contentAfterCursor);
      
      // Add a check to verify content was updated correctly
      requestAnimationFrame(() => {
        const newElement = document.querySelector(
          `[data-id="${newBulletId}"] .bullet-content`
        ) as HTMLElement;
        
        if (newElement) {
          // Verify content was updated correctly
          if (newElement.textContent === contentAfterCursor) {
            newElement.focus();
            try {
              const textNode = newElement.firstChild || newElement.appendChild(document.createTextNode(contentAfterCursor));
              const range = document.createRange();
              const selection = window.getSelection();
              range.setStart(textNode, 0);
              range.collapse(true);
              selection?.removeAllRanges();
              selection?.addRange(range);
            } catch (err) {
              console.error('Failed to set cursor position:', err);
            }
          } else {
            console.error('Content merge verification failed');
          }
        }
      });
    }
  }
};