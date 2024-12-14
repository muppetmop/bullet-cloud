import React, { useRef, useEffect, useState } from "react";
import { BulletPoint } from "@/types/bullet";
import { ChevronRight, ChevronDown } from "lucide-react";
import { useKeyboardHandlers } from "./handlers/useKeyboardHandlers";

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
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [pendingSplit, setPendingSplit] = useState<PendingSplit | null>(null);
  const [splitCompleted, setSplitCompleted] = useState(false);

  const { handleKeyDown } = useKeyboardHandlers({
    contentRef,
    bullet,
    onUpdate,
    onDelete,
    onNewBullet,
    onNavigate,
    onIndent,
    onOutdent,
    setPendingSplit,
    setPendingDelete,
  });

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
    const handleSplit = async () => {
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
    
    handleSplit();
  }, [pendingSplit, splitCompleted, onNewBullet, onUpdate]);

  const handleInput = () => {
    const content = contentRef.current?.textContent || "";
    onUpdate(bullet.id, content);
  };

  return (
    <div className="flex items-start gap-1">
      {bullet.children.length > 0 ? (
        <button
          className="collapse-button mt-1"
          onClick={() => onCollapse(bullet.id)}
        >
          {bullet.isCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      ) : (
        <span className="w-4 h-4 inline-flex items-center justify-center mt-1">
          •
        </span>
      )}
      <div
        ref={contentRef}
        className="bullet-content py-1"
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        suppressContentEditableWarning
      />
    </div>
  );
};

export default BulletContent;