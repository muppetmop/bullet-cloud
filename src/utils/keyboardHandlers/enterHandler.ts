import { BulletPoint } from "@/types/bullet";
import { toast } from "sonner";

export const handleEnterKey = (
  e: React.KeyboardEvent,
  content: string,
  bullet: BulletPoint,
  pos: number,
  onUpdate: (id: string, content: string) => void,
  onNewBullet: (id: string) => string | null,
  onTransferChildren?: (fromBulletId: string, toBulletId: string) => void
) => {
  e.preventDefault();
  const beforeCursor = content.slice(0, pos);
  const afterCursor = content.slice(pos);
  
  console.log('Enter key pressed:', {
    bullet: {
      id: bullet.id,
      content,
      position: bullet.position,
      level: bullet.level
    },
    split: {
      beforeCursor,
      afterCursor,
      position: pos
    }
  });

  onUpdate(bullet.id, beforeCursor);
  
  const newBulletId = onNewBullet(bullet.id);
  console.log('New bullet created:', {
    id: newBulletId,
    parentId: bullet.id,
    content: afterCursor
  });
  
  if (newBulletId) {
    onUpdate(newBulletId, afterCursor);
    
    if (bullet.children.length > 0 && onTransferChildren) {
      console.log('Transferring children:', {
        from: bullet.id,
        to: newBulletId,
        childCount: bullet.children.length
      });
      onTransferChildren(bullet.id, newBulletId);
    }

    requestAnimationFrame(() => {
      const newElement = document.querySelector(
        `[data-id="${newBulletId}"] .bullet-content`
      ) as HTMLElement;
      if (newElement) {
        newElement.focus();
        try {
          const selection = window.getSelection();
          const range = document.createRange();
          const textNode = newElement.firstChild || newElement;
          range.setStart(textNode, 0);
          range.setEnd(textNode, 0);
          selection?.removeAllRanges();
          selection?.addRange(range);
          
          console.log('Cursor position set:', {
            element: newBulletId,
            position: 0,
            success: true
          });
        } catch (err) {
          console.error('Failed to set cursor:', err);
          toast.error("Failed to set cursor position");
        }
      }
    });
  }
};