import React, { useRef, KeyboardEvent, useEffect } from "react";
import { BulletPoint } from "@/types/bullet";
import { ChevronRight, ChevronDown } from "lucide-react";

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
    contentRef.current.textContent = bullet.content;
  }, [bullet.content]);

  const handleKeyDown = (e: KeyboardEvent) => {
    const content = contentRef.current?.textContent || "";
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    const pos = range?.startOffset || 0;

    if (e.key === "Enter") {
      e.preventDefault();
      onUpdate(bullet.id, content);
      const newBulletId = onNewBullet(bullet.id);
      if (newBulletId !== null) {
        setTimeout(() => {
          const newElement = document.querySelector(
            `[data-id="${newBulletId}"] .bullet-content`
          ) as HTMLElement;
          if (newElement) {
            newElement.focus();
          }
        }, 0);
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
    } else if (e.key === "Backspace" && !content && !bullet.children.length) {
      e.preventDefault();
      onDelete(bullet.id);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onUpdate(bullet.id, content);
      onNavigate("up", bullet.id);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onUpdate(bullet.id, content);
      onNavigate("down", bullet.id);
    }
  };

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