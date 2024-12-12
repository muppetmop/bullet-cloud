import React, { useRef, KeyboardEvent, useEffect } from "react";
import { BulletPoint } from "@/types/bullet";
import { ChevronRight, ChevronDown } from "lucide-react";
import {
  handleEnterKey,
  handleTabKey,
  handleBackspaceKey,
  handleArrowKeys,
} from "@/utils/keyboardHandlers";

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

  useEffect(() => {
    if (!contentRef.current) return;
    
    // Only update if content has changed
    if (contentRef.current.textContent !== bullet.content) {
      console.log('Updating content ref:', {
        bulletId: bullet.id,
        content: bullet.content,
        currentContent: contentRef.current.textContent
      });
      
      contentRef.current.textContent = bullet.content;
      
      // Preserve selection if element is focused
      if (document.activeElement === contentRef.current) {
        const selection = window.getSelection();
        const range = selection?.getRangeAt(0);
        if (range) {
          const pos = range.startOffset;
          requestAnimationFrame(() => {
            try {
              const newRange = document.createRange();
              const textNode = contentRef.current?.firstChild || contentRef.current;
              const newPos = Math.min(pos, bullet.content.length);
              newRange.setStart(textNode, newPos);
              newRange.setEnd(textNode, newPos);
              selection?.removeAllRanges();
              selection?.addRange(newRange);
            } catch (err) {
              console.error('Failed to restore cursor position:', err);
            }
          });
        }
      }
    }
  }, [bullet.id, bullet.content]);

  const handleKeyDown = (e: KeyboardEvent) => {
    const content = contentRef.current?.textContent || "";
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    const pos = range?.startOffset || 0;

    if (e.key === "Enter") {
      handleEnterKey(e, content, bullet, onUpdate, onNewBullet);
    } else if (e.key === "Tab") {
      handleTabKey(e, content, bullet, pos, onUpdate, onIndent, onOutdent);
    } else if (e.key === "Backspace") {
      handleBackspaceKey(e, content, bullet, pos, contentRef, onUpdate, onDelete);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      handleArrowKeys(e, content, bullet, onUpdate, onNavigate);
    }
  };

  const handleInput = () => {
    const content = contentRef.current?.textContent || "";
    console.log('Input handler:', {
      bulletId: bullet.id,
      newContent: content
    });
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
        className="bullet-content py-1 min-w-[1ch] outline-none"
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        suppressContentEditableWarning
      />
    </div>
  );
};

export default BulletContent;