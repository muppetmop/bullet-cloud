import React, { useState, useCallback } from "react";
import { BulletPoint } from "@/types/bullet";
import BulletActions from "./BulletActions";
import BulletInput from "./BulletInput";
import { useBulletUpdates } from "@/hooks/useBulletUpdates";
import {
  handleTabKey,
  handleArrowKeys,
} from "@/utils/keyboardHandlers";

interface BulletContentProps {
  bullet: BulletPoint;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onNewBullet: (id: string) => Promise<string | null>;
  onCollapse: (id: string) => void;
  onNavigate: (direction: "up" | "down", id: string) => void;
  onIndent?: (id: string) => void;
  onOutdent?: (id: string) => void;
}

const BulletContent: React.FC<BulletContentProps> = ({
  bullet,
  onUpdate,
  onDelete,
  onNewBullet,
  onCollapse,
  onNavigate,
  onIndent,
  onOutdent,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { saveBulletToSupabase } = useBulletUpdates();

  const handleSplit = useCallback(async (beforeCursor: string, afterCursor: string) => {
    onUpdate(bullet.id, beforeCursor);
    const newBulletId = await onNewBullet(bullet.id);
    
    if (newBulletId) {
      onUpdate(newBulletId, afterCursor);
      saveBulletToSupabase(bullet.id, beforeCursor);
      saveBulletToSupabase(newBulletId, afterCursor);
      
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
    }
  }, [bullet.id, onUpdate, onNewBullet, saveBulletToSupabase]);

  const handleBackspace = useCallback(async (e: React.KeyboardEvent, content: string, pos: number) => {
    if (pos === 0 && !isProcessing) {
      const visibleBullets = Array.from(
        document.querySelectorAll('.bullet-content')
      ) as HTMLElement[];
      
      const currentIndex = visibleBullets.findIndex(
        el => el === e.target
      );
      
      if (currentIndex > 0) {
        const previousElement = visibleBullets[currentIndex - 1];
        const previousContent = previousElement.textContent || '';
        const previousBulletId = previousElement.closest('[data-id]')?.getAttribute('data-id');
        
        if (previousBulletId) {
          setIsProcessing(true);
          
          if (content.length === 0) {
            if (visibleBullets.length > 1 && bullet.children.length === 0) {
              await onDelete(bullet.id);
              
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
                setIsProcessing(false);
              });
            }
          } else {
            e.preventDefault();
            const newContent = previousContent + content;
            onUpdate(previousBulletId, newContent);
            saveBulletToSupabase(previousBulletId, newContent);
            await onDelete(bullet.id);
            
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
              setIsProcessing(false);
            });
          }
        }
      }
    }
  }, [bullet.children.length, bullet.id, isProcessing, onDelete, onUpdate, saveBulletToSupabase]);

  const handleKeyDown = useCallback(async (e: React.KeyboardEvent) => {
    if (isProcessing) {
      e.preventDefault();
      return;
    }

    const content = (e.target as HTMLElement).textContent || "";
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    const pos = range?.startOffset || 0;

    if (e.key === "Enter") {
      e.preventDefault();
      setIsProcessing(true);
      const beforeCursor = content.slice(0, pos);
      const afterCursor = content.slice(pos);
      await handleSplit(beforeCursor, afterCursor);
      setIsProcessing(false);
    } else if (e.key === "Tab") {
      handleTabKey(e, content, bullet, pos, onUpdate, onIndent, onOutdent);
    } else if (e.key === "Backspace") {
      await handleBackspace(e, content, pos);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      handleArrowKeys(e, content, bullet, onUpdate, onNavigate);
    }
  }, [bullet, handleBackspace, handleSplit, isProcessing, onIndent, onNavigate, onOutdent, onUpdate]);

  const handleInput = useCallback(() => {
    const content = (document.querySelector(`[data-id="${bullet.id}"] .bullet-content`) as HTMLElement)?.textContent || "";
    onUpdate(bullet.id, content);
    saveBulletToSupabase(bullet.id, content);
  }, [bullet.id, onUpdate, saveBulletToSupabase]);

  return (
    <div className="flex items-start gap-1">
      <BulletActions
        hasChildren={bullet.children.length > 0}
        isCollapsed={bullet.isCollapsed}
        onCollapse={() => onCollapse(bullet.id)}
      />
      <BulletInput
        content={bullet.content}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

export default BulletContent;