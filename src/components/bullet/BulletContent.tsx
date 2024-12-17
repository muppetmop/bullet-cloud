import React, { useRef, KeyboardEvent, useEffect, useState } from "react";
import { BulletPoint } from "@/types/bullet";
import { ChevronRight, ChevronDown } from "lucide-react";
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
  onFocus: (id: string) => void;
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
  onFocus,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    bulletId: string;
    previousContent: string;
    previousBulletId: string;
  } | null>(null);
  const [pendingSplit, setPendingSplit] = useState<{
    originalBulletId: string;
    beforeCursor: string;
    afterCursor: string;
  } | null>(null);
  const [splitCompleted, setSplitCompleted] = useState(false);

  useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.textContent = bullet.content;
  }, [bullet.content]);

  useEffect(() => {
    if (pendingDelete) {
      onDelete(pendingDelete.bulletId);
      setPendingDelete(null);
    }
  }, [pendingDelete, onDelete]);

  useEffect(() => {
    if (pendingSplit && !splitCompleted) {
      onUpdate(pendingSplit.originalBulletId, pendingSplit.beforeCursor);
      setSplitCompleted(true);
    }
  }, [pendingSplit, splitCompleted, onUpdate]);

  useEffect(() => {
    const handleNewBullet = async () => {
      if (pendingSplit && splitCompleted) {
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
        }
      }
    };

    handleNewBullet();
  }, [pendingSplit, splitCompleted, onNewBullet, onUpdate]);

  const handleKeyDown = (e: KeyboardEvent) => {
    const content = contentRef.current?.textContent || "";
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    const pos = range?.startOffset || 0;

    if (e.key === "Enter") {
      e.preventDefault();
      const beforeCursor = content.slice(0, pos);
      const afterCursor = content.slice(pos);
      
      setPendingSplit({
        originalBulletId: bullet.id,
        beforeCursor,
        afterCursor,
      });
    } else if (e.key === "Tab") {
      handleTabKey(e, content, bullet, pos, onUpdate, onIndent, onOutdent);
    } else if (e.key === "Backspace") {
      handleBackspace(e, content, pos);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      handleArrowKeys(e, content, bullet, onUpdate, onNavigate);
    }
  };

  const handleBackspace = (e: KeyboardEvent, content: string, pos: number) => {
    if (pos === 0) {
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
            }
          } else {
            e.preventDefault();
            onUpdate(previousBulletId, previousContent + content);
            setPendingDelete({ 
              bulletId: bullet.id, 
              previousContent: previousContent + content,
              previousBulletId
            });
            
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
          }
        }
      }
    }
  };

  const handleInput = () => {
    const content = contentRef.current?.textContent || "";
    onUpdate(bullet.id, content);
  };

  return (
    <div className={`flex items-start gap-1 group relative py-0.5 ${bullet.children.length > 0 ? 'bullet-expandable' : ''}`}>
      <div className="flex items-center gap-1">
        {bullet.children.length > 0 && (
          <button
            className="collapse-button"
            onClick={() => onCollapse(bullet.id)}
            aria-label={bullet.isCollapsed ? "Expand" : "Collapse"}
          >
            {bullet.isCollapsed ? (
              <ChevronRight className="w-3 h-3 text-gray-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-gray-400" />
            )}
          </button>
        )}
        <button
          className="bullet-icon"
          onClick={() => onFocus(bullet.id)}
          aria-label="Focus on bullet"
        />
      </div>
      <div
        ref={contentRef}
        className="bullet-content flex-grow"
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        suppressContentEditableWarning
      />
    </div>
  );
};

export default BulletContent;