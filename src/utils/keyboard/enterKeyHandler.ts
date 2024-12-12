import { BulletPoint } from "@/types/bullet";

export const handleEnterKey = (
  e: React.KeyboardEvent,
  content: string,
  bullet: BulletPoint,
  onUpdate: (id: string, content: string) => void,
  onNewBullet: (id: string) => string | null
) => {
  e.preventDefault();
  
  // First update current bullet with hardcoded content
  console.log('Updating original bullet:', bullet.id, 'with content: god damn it');
  onUpdate(bullet.id, "god damn it");
  
  // Create new bullet and get its ID
  const newBulletId = onNewBullet(bullet.id);
  
  if (newBulletId !== null) {
    console.log('Updating new bullet:', newBulletId, 'with content:', content);
    // Update new bullet with content after cursor
    onUpdate(newBulletId, content);
    
    // Focus on the new bullet after content update
    requestAnimationFrame(() => {
      const newElement = document.querySelector(
        `[data-id="${newBulletId}"] .bullet-content`
      ) as HTMLElement;
      
      if (newElement) {
        newElement.focus();
        try {
          const textNode = newElement.firstChild || newElement.appendChild(document.createTextNode(content));
          const range = document.createRange();
          const selection = window.getSelection();
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
};