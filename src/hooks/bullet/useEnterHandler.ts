import { useState, useEffect } from "react";
import { BulletPoint } from "@/types/bullet";

interface EnterHandlerProps {
  bullet: BulletPoint;
  onUpdate: (id: string, content: string) => void;
  onNewBullet: (id: string) => Promise<string | null>;
}

interface PendingSplit {
  originalBulletId: string;
  beforeCursor: string;
  afterCursor: string;
}

export const useEnterHandler = ({
  bullet,
  onUpdate,
  onNewBullet,
}: EnterHandlerProps) => {
  const [pendingSplit, setPendingSplit] = useState<PendingSplit | null>(null);
  const [splitCompleted, setSplitCompleted] = useState(false);
  const [isProcessingEnter, setIsProcessingEnter] = useState(false);

  useEffect(() => {
    if (pendingSplit && !splitCompleted) {
      onUpdate(pendingSplit.originalBulletId, pendingSplit.beforeCursor);
      setSplitCompleted(true);
    }
  }, [pendingSplit, splitCompleted, onUpdate]);

  useEffect(() => {
    const createNewBulletAfterSplit = async () => {
      if (pendingSplit && splitCompleted && !isProcessingEnter) {
        setIsProcessingEnter(true);
        const newBulletId = await onNewBullet(pendingSplit.originalBulletId);
        
        if (newBulletId) {
          onUpdate(newBulletId, pendingSplit.afterCursor);

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
              } catch (err) {
                console.error('Failed to set cursor position:', err);
              }
            }
          });

          setPendingSplit(null);
          setSplitCompleted(false);
          setIsProcessingEnter(false);
        }
      }
    };

    createNewBulletAfterSplit();
  }, [pendingSplit, splitCompleted, onNewBullet, onUpdate, isProcessingEnter]);

  const handleEnter = (content: string, pos: number) => {
    if (!isProcessingEnter) {
      const beforeCursor = content.slice(0, pos);
      const afterCursor = content.slice(pos);
      
      setPendingSplit({
        originalBulletId: bullet.id,
        beforeCursor,
        afterCursor,
      });
    }
    return true;
  };

  return { handleEnter, isProcessingEnter };
};