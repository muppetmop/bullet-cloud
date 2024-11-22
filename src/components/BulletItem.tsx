import React, { useRef, KeyboardEvent, useEffect, useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { BulletPoint } from "@/types/bullet";

interface BulletItemProps {
  bullet: BulletPoint;
  level: number;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onNewBullet: (id: string) => string | null;
  onCollapse: (id: string) => void;
  onNavigate: (direction: "up" | "down", id: string) => void;
  onIndent?: (id: string) => void;
  onOutdent?: (id: string) => void;
}

const BulletItem: React.FC<BulletItemProps> = ({
  bullet,
  level,
  onUpdate,
  onDelete,
  onNewBullet,
  onCollapse,
  onNavigate,
  onIndent,
  onOutdent,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [shouldFocus, setShouldFocus] = useState(false);
  const [selectionState, setSelectionState] = useState<{start: number, end: number} | null>(null);

  // First useEffect to update content
  useEffect(() => {
    console.log('Content update effect running', { content: bullet.content });
    if (contentRef.current) {
      contentRef.current.textContent = bullet.content;
    }
  }, [bullet.content]);

  // Second useEffect to handle focus and selection
  useEffect(() => {
    console.log('Focus effect running', { shouldFocus, selectionState, content: bullet.content });
    if (shouldFocus && contentRef.current && selectionState) {
      const focusAndSelect = () => {
        if (!contentRef.current) return;
        
        console.log('Attempting to restore focus and selection');
        contentRef.current.focus();
        
        const textNode = contentRef.current.firstChild || contentRef.current;
        const range = document.createRange();
        const selection = window.getSelection();

        try {
          range.setStart(textNode, selectionState.start);
          range.setEnd(textNode, selectionState.end);
          selection?.removeAllRanges();
          selection?.addRange(range);
          console.log('Focus and selection restored successfully');
        } catch (err) {
          console.error('Error restoring selection:', err);
          contentRef.current.focus();
        }
      };

      // Execute focus restoration after a brief delay
      requestAnimationFrame(() => {
        focusAndSelect();
        // Only reset states after successful focus
        setShouldFocus(false);
        setSelectionState(null);
      });
    }
  }, [shouldFocus, selectionState, bullet.content]);

  const handleKeyDown = (e: KeyboardEvent) => {
    const content = contentRef.current?.textContent || "";
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);

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
      console.log('Tab pressed, saving selection state');
      
      // Save selection state before any content updates
      const newSelectionState = {
        start: range?.startOffset || 0,
        end: range?.endOffset || 0
      };
      
      // Update content first
      onUpdate(bullet.id, content);
      
      // Then handle indentation
      if (e.shiftKey && onOutdent) {
        onOutdent(bullet.id);
      } else if (!e.shiftKey && onIndent) {
        onIndent(bullet.id);
      }
      
      // Set states after content update and indentation
      setSelectionState(newSelectionState);
      setShouldFocus(true);
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
    <div className="bullet-item" data-id={bullet.id}>
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
      {!bullet.isCollapsed && bullet.children.length > 0 && (
        <div className="bullet-children">
          {bullet.children.map((child) => (
            <BulletItem
              key={child.id}
              bullet={child}
              level={level + 1}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onNewBullet={onNewBullet}
              onCollapse={onCollapse}
              onNavigate={onNavigate}
              onIndent={onIndent}
              onOutdent={onOutdent}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BulletItem;