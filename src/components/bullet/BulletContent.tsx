import React, { useRef, useEffect } from "react";
import { BulletPoint } from "@/types/bullet";
import { useKeyboardHandlers } from "./handlers/useKeyboardHandlers";

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
  const cursorPositionRef = useRef<number | null>(null);
  
  const {
    handleKeyDown,
    pendingSplit,
    setPendingSplit,
    splitCompleted,
    setSplitCompleted
  } = useKeyboardHandlers({
    bullet,
    mode,
    contentRef,
    onUpdate,
    onDelete,
    onIndent,
    onOutdent,
    onNavigate
  });

  useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.textContent = bullet.content;
  }, [bullet.content]);

  // Add effect to maintain focus
  useEffect(() => {
    if (mode === "yours" && contentRef.current) {
      contentRef.current.focus();
      
      // Restore cursor position if it was saved
      if (cursorPositionRef.current !== null) {
        const selection = window.getSelection();
        const range = document.createRange();
        const textNode = contentRef.current.firstChild || contentRef.current;
        const position = Math.min(cursorPositionRef.current, (contentRef.current.textContent || '').length);
        
        try {
          range.setStart(textNode, position);
          range.setEnd(textNode, position);
          selection?.removeAllRanges();
          selection?.addRange(range);
        } catch (err) {
          console.error('Failed to restore cursor position:', err);
        }
      }
    }
  }, [mode]);

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
        
        if (bullet.children.length > 0 && onTransferChildren) {
          onTransferChildren(bullet.id, newBulletId);
        }

        requestAnimationFrame(() => {
          const elementToFocus = pendingSplit.focusOriginal
            ? document.querySelector(`[data-id="${bullet.id}"] .bullet-content`)
            : document.querySelector(`[data-id="${newBulletId}"] .bullet-content`);
          
          if (elementToFocus instanceof HTMLElement) {
            elementToFocus.focus();
            try {
              const selection = window.getSelection();
              const range = document.createRange();
              const textNode = elementToFocus.firstChild || elementToFocus;
              const position = pendingSplit.focusOriginal ? 0 : 0;
              range.setStart(textNode, position);
              range.setEnd(textNode, position);
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
  }, [pendingSplit, splitCompleted, onNewBullet, onUpdate, bullet.children, onTransferChildren]);

  const handleInput = () => {
    if (mode === "theirs") return;
    const content = contentRef.current?.textContent || "";
    onUpdate(bullet.id, content);
  };

  const handleFocus = (e: React.FocusEvent) => {
    // Save current cursor position before handling focus
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      cursorPositionRef.current = range.startOffset;
    }
    
    // Prevent focus from being lost
    e.stopPropagation();
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Only allow blur if clicking outside the bullet area
    if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    e.preventDefault();
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
      <div className={`bullet-wrapper ${mode === "theirs" ? "theirs-mode" : ""}`}>
        <span 
          className="w-4 h-4 inline-flex items-center justify-center mt-1 cursor-pointer bullet-icon"
          onClick={() => onZoom(bullet.id)}
        >
          ◉
        </span>
        <div
          ref={contentRef}
          className={`bullet-content ${mode === "theirs" ? "theirs-mode" : ""} py-1`}
          contentEditable={mode !== "theirs"}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          suppressContentEditableWarning
          tabIndex={0}
        />
      </div>
    </>
  );
};

export default BulletContent;