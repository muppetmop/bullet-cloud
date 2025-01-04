import { useCallback } from 'react';
import { BulletPoint } from '@/types/bullet';
import { isMobileDevice } from '@/utils/deviceDetection';
import { getCursorPosition, setCursorPosition, getTouchPosition } from '@/utils/cursorUtils';

interface BulletHandlerProps {
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onNewBullet: (id: string) => string | null;
  onTransferChildren?: (fromBulletId: string, toBulletId: string) => void;
}

export const useBulletHandlers = ({
  onUpdate,
  onDelete,
  onNewBullet,
  onTransferChildren
}: BulletHandlerProps) => {
  const handleEnterKey = useCallback(async (
    e: React.KeyboardEvent | TouchEvent,
    contentRef: React.RefObject<HTMLDivElement>,
    bullet: BulletPoint
  ) => {
    e.preventDefault();
    if (!contentRef.current) return;

    const content = contentRef.current.textContent || '';
    const cursorPos = isMobileDevice() && 'touches' in e 
      ? getTouchPosition(contentRef.current, e.touches[0])
      : getCursorPosition(contentRef.current);

    const beforeCursor = content.slice(0, cursorPos);
    const afterCursor = content.slice(cursorPos);

    // Update original bullet synchronously
    onUpdate(bullet.id, beforeCursor);

    // Create new bullet
    const newBulletId = onNewBullet(bullet.id);
    if (!newBulletId) return;

    // Handle children transfer if cursor at end and bullet has children
    if (cursorPos === content.length && bullet.children.length > 0 && onTransferChildren) {
      onTransferChildren(bullet.id, newBulletId);
    }

    // Update new bullet content
    onUpdate(newBulletId, afterCursor);

    // Focus new bullet
    requestAnimationFrame(() => {
      const newElement = document.querySelector(
        `[data-id="${newBulletId}"] .bullet-content`
      ) as HTMLElement;
      if (newElement) {
        newElement.focus();
        setCursorPosition(newElement, 0);
      }
    });
  }, [onUpdate, onNewBullet, onTransferChildren]);

  const handleBackspaceKey = useCallback((
    e: React.KeyboardEvent | TouchEvent,
    contentRef: React.RefObject<HTMLDivElement>,
    bullet: BulletPoint
  ) => {
    if (!contentRef.current) return;

    const content = contentRef.current.textContent || '';
    const cursorPos = isMobileDevice() && 'touches' in e 
      ? getTouchPosition(contentRef.current, e.touches[0])
      : getCursorPosition(contentRef.current);

    if (cursorPos === 0) {
      const visibleBullets = Array.from(
        document.querySelectorAll('.bullet-content')
      ) as HTMLElement[];
      
      const currentIndex = visibleBullets.findIndex(
        el => el === contentRef.current
      );
      
      if (currentIndex > 0) {
        const previousElement = visibleBullets[currentIndex - 1];
        const previousContent = previousElement.textContent || '';
        const previousBulletId = previousElement.closest('[data-id]')?.getAttribute('data-id');
        
        if (previousBulletId) {
          if (content.length === 0) {
            if (visibleBullets.length > 1 && bullet.children.length === 0) {
              onDelete(bullet.id);
              
              requestAnimationFrame(() => {
                previousElement.focus();
                setCursorPosition(previousElement, previousContent.length);
              });
            }
          } else {
            e.preventDefault();
            onUpdate(previousBulletId, previousContent + content);
            
            setTimeout(() => {
              onDelete(bullet.id);
            }, 100);
            
            requestAnimationFrame(() => {
              previousElement.focus();
              setCursorPosition(previousElement, previousContent.length);
            });
          }
        }
      }
    }
  }, [onDelete, onUpdate]);

  return {
    handleEnterKey,
    handleBackspaceKey
  };
};