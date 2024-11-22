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
  const [shouldRestoreFocus, setShouldRestoreFocus] = useState(false);
  const [savedSelection, setSavedSelection] = useState<{start: number, end: number} | null>(null);

  // Single useEffect to handle both content and focus
  useEffect(() => {
    // First ensure content is up to date
    if (contentRef.current) {
      contentRef.current.textContent = bullet.content;
    }

    // Then handle focus restoration if needed
    if (shouldRestoreFocus && contentRef.current && savedSelection) {
      const element = contentRef.current;
      
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        element.focus();
        
        const textNode = element.firstChild || element;
        const selection = window.getSelection();
        const range = document.createRange();

        try {
          range.setStart(textNode, savedSelection.start);
          range.setEnd(textNode, savedSelection.end);
          selection?.removeAllRanges();
          selection?.addRange(range);
          console.log('Focus restored with selection:', savedSelection);
        } catch (err) {
          console.error('Error restoring selection, falling back to simple focus');
          element.focus();
        }

        // Clear the focus restoration flags only after attempt
        setShouldRestoreFocus(false);
        setSavedSelection(null);
      });
    }
  }, [bullet.content, shouldRestoreFocus, savedSelection]);

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
      
      // Save current selection before any updates
      const currentSelection = {
        start: range?.startOffset || 0,
        end: range?.endOffset || 0
      };
      
      // Update content
      onUpdate(bullet.id, content);
      
      // Handle indentation
      if (e.shiftKey && onOutdent) {
        onOutdent(bullet.id);
      } else if (!e.shiftKey && onIndent) {
        onIndent(bullet.id);
      }
      
      // Set focus restoration data
      setSavedSelection(currentSelection);
      setShouldRestoreFocus(true);
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