import React, { useRef, KeyboardEvent, useEffect, useState } from "react";
import { BulletPoint } from "@/types/bullet";
import {
  handleTabKey,
  handleArrowKeys,
} from "@/utils/keyboardHandlers";
import BulletWrapper from "./BulletWrapper";
import BulletSourceLink from "./BulletSourceLink";
import BulletContentDisplay from "./BulletContentDisplay";

interface BulletContentProps {
  bullet: BulletPoint;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onNewBullet: (id: string) => string | null;
  onCollapse: (id: string) => void;
  onNavigate: (direction: "up" | "down", id: string) => void;
  onIndent?: (id: string) => void;
  onOutdent?: (id: string) => void;
  onZoom: (id: string) => void;
  mode?: "yours" | "theirs";
}

interface PendingDelete {
  bulletId: string;
  previousContent: string;
  previousBulletId: string;
}

interface PendingSplit {
  originalBulletId: string;
  beforeCursor: string;
  afterCursor: string;
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
  onZoom,
  mode = "yours",
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [pendingSplit, setPendingSplit] = useState<PendingSplit | null>(null);
  const [splitCompleted, setSplitCompleted] = useState(false);
  const [sourceId, setSourceId] = useState<string | null>(null);

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
    if (pendingSplit && splitCompleted) {
      const newBulletId = onNewBullet(pendingSplit.originalBulletId);
      
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
  }, [pendingSplit, splitCompleted, onNewBullet, onUpdate]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (mode === "theirs") return;
    
    const content = contentRef.current?.textContent || "";
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    const pos = range?.startOffset || 0;

    if (e.key === "Enter") {
      if (e.shiftKey) {
        e.preventDefault();
        const textNode = contentRef.current?.firstChild || contentRef.current;
        const newText = content.slice(0, pos) + "\n" + content.slice(pos);
        if (contentRef.current) {
          contentRef.current.textContent = newText;
          onUpdate(bullet.id, newText);
          
          const newRange = document.createRange();
          newRange.setStart(textNode, pos + 1);
          newRange.setEnd(textNode, pos + 1);
          selection?.removeAllRanges();
          selection?.addRange(newRange);
        }
      } else {
        e.preventDefault();
        const beforeCursor = content.slice(0, pos);
        const afterCursor = content.slice(pos);
        
        setPendingSplit({
          originalBulletId: bullet.id,
          beforeCursor,
          afterCursor,
        });
      }
    } else if (e.key === "Tab") {
      handleTabKey(e, content, bullet, pos, onUpdate, onIndent, onOutdent);
    } else if (e.key === "Backspace") {
      handleBackspace(e, content, pos);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      handleArrowKeys(e, content, bullet, onUpdate, onNavigate);
    }
  };

  const handleBackspace = (e: KeyboardEvent, content: string, pos: number) => {
    const selection = window.getSelection();
    
    if (selection && !selection.isCollapsed) {
      return;
    }
    
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
    if (mode === "theirs") return;
    const content = contentRef.current?.textContent || "";
    onUpdate(bullet.id, content);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (mode === "theirs") return;
    
    const sourceId = e.clipboardData.getData('text/bullet-source');
    if (sourceId) {
      setSourceId(sourceId);
    }
  };

  const handleCopy = (e: React.ClipboardEvent) => {
    if (mode === "theirs") {
      e.clipboardData.setData('text/bullet-source', bullet.parent_id || bullet.id);
      e.preventDefault();
      
      const selection = window.getSelection();
      if (selection) {
        e.clipboardData.setData('text/plain', selection.toString());
      }
    }
  };

  return (
    <>
      {bullet.children.length > 0 && (
        <button
          className="collapse-button"
          onClick={() => onCollapse(bullet.id)}
        >
          {bullet.isCollapsed ? (
            <span className="text-gray-400">▶</span>
          ) : (
            <span className="text-gray-400">▼</span>
          )}
        </button>
      )}
      <BulletWrapper mode={mode}>
        <span 
          className="w-4 h-4 inline-flex items-center justify-center mt-1 cursor-pointer bullet-icon"
          onClick={() => onZoom(bullet.id)}
        >
          ◉
        </span>
        <BulletContentDisplay
          content={bullet.content}
          mode={mode}
          contentRef={contentRef}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onCopy={handleCopy}
        />
        {sourceId && mode === "yours" && (
          <BulletSourceLink sourceId={sourceId} onZoom={onZoom} />
        )}
      </BulletWrapper>
    </>
  );
};

export default BulletContent;
