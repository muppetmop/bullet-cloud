import React, { useState, useEffect, useRef, KeyboardEvent } from "react";
import { BulletPoint } from "@/types/bullet";
import { ChevronRight } from "lucide-react";

interface BulletContentProps {
  bullet: BulletPoint;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onNewBullet: (id: string) => string | null;
  onCollapse: (id: string) => void;
  onNavigate: (direction: "up" | "down", id: string) => void;
  onIndent?: (id: string) => void;
  onOutdent?: (id: string) => void;
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
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [pendingSplit, setPendingSplit] = useState<PendingSplit | null>(null);
  const [splitCompleted, setSplitCompleted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pendingDelete) {
      onDelete(pendingDelete);
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
        requestAnimationFrame(() => {
          const newBulletContent = document.querySelector(
            `[data-id="${newBulletId}"] .bullet-content`
          ) as HTMLElement;

          if (newBulletContent) {
            newBulletContent.focus();
            const range = document.createRange();
            const selection = window.getSelection();

            if (selection) {
              range.setStart(newBulletContent, 0);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            }

            onUpdate(newBulletId, pendingSplit.afterCursor);
          }
        });

        setPendingSplit(null);
        setSplitCompleted(false);
      }
    }
  }, [pendingSplit, splitCompleted, onNewBullet, onUpdate]);

  const handleKeyDown = (e: KeyboardEvent) => {
    const content = contentRef.current;
    if (!content) return;

    const selection = window.getSelection();
    if (!selection) return;

    const pos = selection.focusOffset;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const beforeCursor = content.textContent?.slice(0, pos) || "";
      const afterCursor = content.textContent?.slice(pos) || "";

      setPendingSplit({
        originalBulletId: bullet.id,
        beforeCursor,
        afterCursor,
      });
    } else if (e.key === "Backspace") {
      handleBackspace(e, content.textContent || "", pos);
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey && onOutdent) {
        onOutdent(bullet.id);
      } else if (!e.shiftKey && onIndent) {
        onIndent(bullet.id);
      }
    } else if (e.key === "ArrowUp") {
      if (pos === 0) {
        e.preventDefault();
        onNavigate("up", bullet.id);
      }
    } else if (e.key === "ArrowDown") {
      if (pos === (content.textContent || "").length) {
        e.preventDefault();
        onNavigate("down", bullet.id);
      }
    }
  };

  const handleBackspace = (e: KeyboardEvent, content: string, pos: number) => {
    const selection = window.getSelection();
    
    // If there's selected text, let the default behavior handle it
    if (selection && !selection.isCollapsed) {
      return;
    }
    
    if (pos === 0) {
      const visibleBullets = Array.from(
        document.querySelectorAll('.bullet-content')
      ) as HTMLElement[];
      
      const currentIndex = visibleBullets.findIndex(
        (el) => el === contentRef.current
      );
      
      if (currentIndex > 0) {
        e.preventDefault();
        const previousBullet = visibleBullets[currentIndex - 1];
        const previousBulletId = previousBullet.closest('[data-id]')?.getAttribute('data-id');
        
        if (previousBulletId) {
          const previousContent = previousBullet.textContent || '';
          onUpdate(previousBulletId, previousContent + content);
          setPendingDelete(bullet.id);
          
          requestAnimationFrame(() => {
            previousBullet.focus();
            const range = document.createRange();
            const selection = window.getSelection();
            
            if (selection) {
              range.setStart(previousBullet, previousContent.length);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          });
        }
      }
    }
  };

  return (
    <div className="flex items-center gap-2 group">
      {bullet.children.length > 0 && (
        <button
          onClick={() => onCollapse(bullet.id)}
          className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
        >
          <ChevronRight
            className={`h-3 w-3 transition-transform ${
              !bullet.isCollapsed ? "rotate-90" : ""
            }`}
          />
        </button>
      )}
      <div
        ref={contentRef}
        className="bullet-content flex-1 outline-none"
        contentEditable
        suppressContentEditableWarning
        onKeyDown={handleKeyDown}
        onBlur={(e) => onUpdate(bullet.id, e.target.textContent || "")}
        dangerouslySetInnerHTML={{ __html: bullet.content }}
      />
    </div>
  );
};

export default BulletContent;