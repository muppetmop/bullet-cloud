import React, { useRef, KeyboardEvent, useEffect } from "react";
import { BulletPoint } from "@/types/bullet";
import { BulletIcon } from "./BulletIcon";
import { CollapseButton } from "./CollapseButton";
import { useCaretPosition } from "@/hooks/useCaretPosition";
import { handleBackspaceAtStart } from "@/utils/bulletKeyboardHandlers";

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
  onTransferChildren?: (fromBulletId: string, toBulletId: string) => void;
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
  onTransferChildren,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const { saveCaretPosition, restoreCaretPosition, currentPosition } = useCaretPosition(contentRef);
  const skipNextInputRef = useRef(false);
  const lastContentRef = useRef(bullet.content);
  const isSplittingRef = useRef(false);
  const splitTimestampRef = useRef<number | null>(null);
  const lastOperationTimestampRef = useRef<number>(Date.now());
  const domUpdatePromiseRef = useRef<Promise<void> | null>(null);
  const domUpdateResolveRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.textContent = bullet.content;
    if (!isSplittingRef.current) {
      lastContentRef.current = bullet.content;
    }
  }, [bullet.content]);

  const logOperationTiming = (operation: string, details: any = {}) => {
    const now = Date.now();
    const timeSinceLastOperation = now - lastOperationTimestampRef.current;
    console.log(`Operation Timing - ${operation}:`, {
      ...details,
      timeSinceLastOperation,
      timestamp: new Date(now).toISOString(),
      bulletId: bullet.id,
      isSplitting: isSplittingRef.current,
      splitTimestamp: splitTimestampRef.current ? new Date(splitTimestampRef.current).toISOString() : null,
      timeSinceSplit: splitTimestampRef.current ? now - splitTimestampRef.current : null,
    });
    lastOperationTimestampRef.current = now;
  };

  const waitForDomUpdate = () => {
    if (!domUpdatePromiseRef.current) {
      domUpdatePromiseRef.current = new Promise((resolve) => {
        domUpdateResolveRef.current = resolve;
      });
    }
    return domUpdatePromiseRef.current;
  };

  const completeDomUpdate = () => {
    if (domUpdateResolveRef.current) {
      domUpdateResolveRef.current();
      domUpdatePromiseRef.current = null;
      domUpdateResolveRef.current = null;
    }
  };

  const handleKeyDown = async (e: KeyboardEvent) => {
    if (mode === "theirs") return;
    
    const content = contentRef.current?.textContent || "";
    saveCaretPosition();
    const pos = currentPosition();

    logOperationTiming('KeyDown', {
      key: e.key,
      content,
      cursorPosition: pos,
      bulletChildren: bullet.children.length,
      skipNextInput: skipNextInputRef.current,
      isSplitting: isSplittingRef.current,
    });

    if (e.key === "Enter") {
      e.preventDefault();
      logOperationTiming('Enter pressed', {
        beforeSplit: {
          content,
          cursorPosition: pos,
          bulletId: bullet.id
        }
      });

      skipNextInputRef.current = true;
      isSplittingRef.current = true;
      splitTimestampRef.current = Date.now();
      
      const beforeCursor = content.slice(0, pos);
      const afterCursor = content.slice(pos);
      
      if (contentRef.current) {
        contentRef.current.textContent = beforeCursor;
      }
      onUpdate(bullet.id, beforeCursor);
      
      const newBulletId = onNewBullet(bullet.id);
      
      if (newBulletId) {
        onUpdate(newBulletId, afterCursor);
        
        if (bullet.children.length > 0 && onTransferChildren) {
          onTransferChildren(bullet.id, newBulletId);
        }

        // Create a new DOM update promise
        await waitForDomUpdate();

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
              
              // Complete the DOM update
              completeDomUpdate();
            } catch (err) {
              console.error('Failed to set cursor position:', err);
              completeDomUpdate();
            }
          } else {
            completeDomUpdate();
          }
          isSplittingRef.current = false;
        });
      }
    } else if (e.key === "Backspace") {
      if (pos === 0) {
        // Wait for any pending DOM updates before processing backspace
        if (domUpdatePromiseRef.current) {
          await domUpdatePromiseRef.current;
        }
        
        e.preventDefault();
        await handleBackspaceAtStart(content, bullet, contentRef, onUpdate, onDelete);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      onUpdate(bullet.id, content);
      
      if (e.shiftKey && onOutdent) {
        onOutdent(bullet.id);
      } else if (!e.shiftKey && onIndent) {
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
          } catch (err) {
            console.error('Failed to restore cursor position:', err);
          }
        }
      }, 0);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      onUpdate(bullet.id, content);
      onNavigate(e.key === "ArrowUp" ? "up" : "down", bullet.id);
    }
  };

  const handleInput = () => {
    if (mode === "theirs") return;
    if (skipNextInputRef.current) {
      logOperationTiming('Skipping input handler', {
        bulletId: bullet.id
      });
      skipNextInputRef.current = false;
      return;
    }
    saveCaretPosition();
    const content = contentRef.current?.textContent || lastContentRef.current;
    logOperationTiming('Input handler', {
      bulletId: bullet.id,
      newContent: content,
      previousContent: lastContentRef.current,
      isSplitting: isSplittingRef.current
    });
    onUpdate(bullet.id, content);
    if (!isSplittingRef.current) {
      lastContentRef.current = content;
    }
    requestAnimationFrame(() => {
      restoreCaretPosition();
    });
  };

  return (
    <>
      {bullet.children.length > 0 && (
        <CollapseButton
          isCollapsed={bullet.isCollapsed}
          onCollapse={() => onCollapse(bullet.id)}
        />
      )}
      <div className={`bullet-wrapper ${mode === "theirs" ? "theirs-mode" : ""}`}>
        <BulletIcon onZoom={() => onZoom(bullet.id)} />
        <div
          ref={contentRef}
          className={`bullet-content ${mode === "theirs" ? "theirs-mode" : ""} py-1`}
          contentEditable={mode !== "theirs"}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          suppressContentEditableWarning
        />
      </div>
    </>
  );
};

export default BulletContent;