import { BulletPoint } from "@/types/bullet";
import { KeyboardEvent } from "react";

interface BackspaceHandlerProps {
  bullet: BulletPoint;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
}

export const useBackspaceHandler = ({
  bullet,
  onDelete,
  onUpdate,
}: BackspaceHandlerProps) => {
  const handleBackspace = (e: KeyboardEvent, content: string, pos: number) => {
    if (pos === 0) {
      const visibleBullets = Array.from(
        document.querySelectorAll('.bullet-content')
      ) as HTMLElement[];
      
      const currentIndex = visibleBullets.findIndex(
        el => el === e.currentTarget
      );
      
      if (currentIndex > 0) {
        e.preventDefault();
        const previousElement = visibleBullets[currentIndex - 1];
        const previousContent = previousElement.textContent || '';
        const previousBulletId = previousElement.closest('[data-id]')?.getAttribute('data-id');
        
        if (previousBulletId) {
          if (content.length === 0) {
            // Only delete the current bullet if it's empty
            onDelete(bullet.id);
            
            requestAnimationFrame(() => {
              previousElement.focus();
              try {
                const selection = window.getSelection();
                const range = document.createRange();
                const textNode = previousElement.firstChild || previousElement;
                const position = previousContent.length;
                range.setStart(textNode, position);
                range.setEnd(textNode, position);
                selection?.removeAllRanges();
                selection?.addRange(range);
              } catch (err) {
                console.error('Failed to set cursor position:', err);
              }
            });
          } else {
            // Merge content with the previous bullet
            const newContent = previousContent + content;
            onUpdate(previousBulletId, newContent);
            onDelete(bullet.id);
            
            requestAnimationFrame(() => {
              previousElement.focus();
              try {
                const selection = window.getSelection();
                const range = document.createRange();
                const textNode = previousElement.firstChild || previousElement;
                range.setStart(textNode, previousContent.length);
                range.setEnd(textNode, previousContent.length);
                selection?.removeAllRanges();
                selection?.addRange(range);
              } catch (err) {
                console.error('Failed to set cursor position:', err);
              }
            });
          }
        }
      }
    }
  };

  return { handleBackspace };
};