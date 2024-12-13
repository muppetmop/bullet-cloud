import { BulletPoint } from "@/types/bullet";
import { KeyboardEvent, useCallback } from "react";

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
  const handleBackspace = useCallback((e: KeyboardEvent, content: string, pos: number) => {
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
            onDelete(bullet.id);
            
            // Focus previous element immediately
            previousElement.focus();
            const selection = window.getSelection();
            const range = document.createRange();
            const textNode = previousElement.firstChild || previousElement;
            const position = previousContent.length;
            
            try {
              range.setStart(textNode, position);
              range.setEnd(textNode, position);
              selection?.removeAllRanges();
              selection?.addRange(range);
            } catch (err) {
              console.error('Failed to set cursor position:', err);
            }
          } else {
            // Merge content with the previous bullet
            const newContent = previousContent + content;
            onUpdate(previousBulletId, newContent);
            
            // Focus and position cursor before deleting
            previousElement.focus();
            const selection = window.getSelection();
            const range = document.createRange();
            const textNode = previousElement.firstChild || previousElement;
            
            try {
              range.setStart(textNode, previousContent.length);
              range.setEnd(textNode, previousContent.length);
              selection?.removeAllRanges();
              selection?.addRange(range);
            } catch (err) {
              console.error('Failed to set cursor position:', err);
            }
            
            // Delete after cursor is positioned
            onDelete(bullet.id);
          }
        }
      }
    }
  }, [bullet.id, onDelete, onUpdate]);

  return { handleBackspace };
};