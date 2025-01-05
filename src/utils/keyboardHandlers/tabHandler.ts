import { BulletPoint } from "@/types/bullet";

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
  
  console.log('Tab key pressed:', {
    bullet: {
      id: bullet.id,
      content,
      position: bullet.position,
      level: bullet.level
    },
    isShift: e.shiftKey
  });
  
  if (e.shiftKey && onOutdent) {
    console.log('Outdenting bullet:', bullet.id);
    onOutdent(bullet.id);
  } else if (!e.shiftKey && onIndent) {
    console.log('Indenting bullet:', bullet.id);
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
        
        console.log('Cursor position restored:', {
          element: bullet.id,
          position: pos,
          success: true
        });
      } catch (err) {
        console.error('Failed to restore cursor:', err);
      }
    }
  }, 0);
};