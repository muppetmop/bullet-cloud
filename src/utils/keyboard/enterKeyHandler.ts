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

  // Important: First update the original bullet to remove the "after" portion
  // This prevents the text duplication issue
  onUpdate(bullet.id, beforeCursor);
  
  // Verify the update by checking the DOM
  const bulletElement = document.querySelector(
    `[data-id="${bullet.id}"] .bullet-content`
  ) as HTMLElement;
  
  if (bulletElement) {
    // Wait for React to update the DOM
    requestAnimationFrame(() => {
      const currentContent = bulletElement.textContent;
      console.log('Verification check:', {
        bulletId: bullet.id,
        expectedContent: beforeCursor,
        actualContent: currentContent
      });

      // Only create new bullet after verifying the update
      if (currentContent === beforeCursor) {
        // Now create the new bullet with the "after" portion
        const newBulletId = onNewBullet(bullet.id);
        
        console.log('New bullet created:', {
          originalBulletId: bullet.id,
          newBulletId,
          contentToMove: afterCursor
        });

        if (newBulletId) {
          // Update the new bullet with the "after" portion
          onUpdate(newBulletId, afterCursor);
          
          // Focus the new bullet
          requestAnimationFrame(() => {
            const newElement = document.querySelector(
              `[data-id="${newBulletId}"] .bullet-content`
            ) as HTMLElement;
            
            if (newElement) {
              newElement.focus();
              try {
                // Set cursor at the start of the new bullet's content
                const range = document.createRange();
                const selection = window.getSelection();
                const textNode = newElement.firstChild || newElement;
                range.setStart(textNode, 0);
                range.collapse(true);
                selection?.removeAllRanges();
                selection?.addRange(range);
              } catch (err) {
                console.error('Failed to set cursor position:', err);
              }
            }
          });
        }
      } else {
        console.error('Content update verification failed:', {
          bulletId: bullet.id,
          expectedContent: beforeCursor,
          actualContent: currentContent
        });
      }
    });
  }
};