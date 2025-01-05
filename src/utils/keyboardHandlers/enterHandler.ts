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
  
  const operationState = {
    isProcessing: true,
    startTime: Date.now(),
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
    },
    domState: {
      selection: window.getSelection()?.toString(),
      activeElement: document.activeElement,
      currentContent: document.querySelector(`[data-id="${bullet.id}"] .bullet-content`)?.textContent
    }
  };

  console.log('Enter key pressed:', operationState);

  // Update original bullet with content before cursor
  console.log('Updating original bullet:', {
    id: bullet.id,
    oldContent: content,
    newContent: beforeCursor,
    timestamp: Date.now()
  });
  
  onUpdate(bullet.id, beforeCursor);
  
  const newBulletId = onNewBullet(bullet.id);
  console.log('New bullet created:', {
    id: newBulletId,
    parentId: bullet.id,
    content: afterCursor,
    timestamp: Date.now(),
    operationDuration: Date.now() - operationState.startTime
  });
  
  if (newBulletId) {
    console.log('Updating new bullet content:', {
      id: newBulletId,
      content: afterCursor,
      timestamp: Date.now()
    });
    
    onUpdate(newBulletId, afterCursor);
    
    if (bullet.children.length > 0 && onTransferChildren) {
      console.log('Transferring children:', {
        from: bullet.id,
        to: newBulletId,
        childCount: bullet.children.length,
        timestamp: Date.now()
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
            success: true,
            finalState: {
              domContent: newElement.textContent,
              selection: selection?.toString(),
              range: {
                startOffset: range.startOffset,
                endOffset: range.endOffset
              },
              operationComplete: true,
              duration: Date.now() - operationState.startTime
            }
          });
        } catch (err) {
          console.error('Failed to set cursor:', err);
          toast.error("Failed to set cursor position");
        }
      }
    });
  }
};