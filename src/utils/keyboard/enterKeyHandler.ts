import { BulletPoint } from "@/types/bullet";

export const handleEnterKey = (
  e: React.KeyboardEvent,
  content: string,
  bullet: BulletPoint,
  onUpdate: (id: string, content: string) => void,
  onNewBullet: (id: string) => string | null
) => {
  e.preventDefault();
  
  // Get cursor position
  const target = e.target as HTMLDivElement;
  const cursorPosition = window.getSelection()?.getRangeAt(0).startOffset || 0;
  
  // Create temporary DOM element to verify content splitting
  const tempDiv = document.createElement('div');
  tempDiv.textContent = content;
  
  // Split content at cursor position
  const beforeCursor = content.substring(0, cursorPosition);
  const afterCursor = content.substring(cursorPosition);
  
  // Verify content splitting in temp element
  const verifyContentSplit = () => {
    tempDiv.textContent = beforeCursor;
    return tempDiv.textContent === beforeCursor;
  };
  
  if (verifyContentSplit()) {
    // First update the original bullet
    console.log('Updating original bullet:', bullet.id, 'with content: god damn it');
    onUpdate(bullet.id, "god damn it");
    
    // Create new bullet and get its ID
    const newBulletId = onNewBullet(bullet.id);
    
    if (newBulletId !== null) {
      console.log('Updating new bullet:', newBulletId, 'with content:', afterCursor);
      // Update new bullet with content after cursor
      onUpdate(newBulletId, afterCursor);
      
      // Focus on the new bullet after content update
      requestAnimationFrame(() => {
        const newElement = document.querySelector(
          `[data-id="${newBulletId}"] .bullet-content`
        ) as HTMLElement;
        
        if (newElement) {
          newElement.focus();
          try {
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
    console.error('Failed to verify content split');
  }
};