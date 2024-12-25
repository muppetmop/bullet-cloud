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
  const lastTouchRef = useRef<number>(0);
  
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

  const handleTouchStart = () => {
    lastTouchRef.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (Date.now() - lastTouchRef.current < 200) {
      if (contentRef.current) {
        contentRef.current.focus();
        e.stopPropagation();
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
      <div className={`bullet-wrapper ${mode === "theirs" ? "theirs-mode" : ""}`}>
        <span 
          className="bullet-icon"
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
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          suppressContentEditableWarning
          tabIndex={0}
        />
      </div>
    </>
  );
};

export default BulletContent;