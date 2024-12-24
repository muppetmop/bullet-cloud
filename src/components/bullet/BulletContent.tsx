import React, { useRef, useEffect } from "react";
import { BulletPoint } from "@/types/bullet";
import BulletWrapper from "./BulletWrapper";
import BulletSourceLink from "./BulletSourceLink";
import { useKeyboardHandlers } from "./handlers/useKeyboardHandlers";
import { useClipboardHandlers } from "./handlers/useClipboardHandlers";

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

  const { handleKeyDown } = useKeyboardHandlers({
    contentRef,
    bullet,
    mode,
    onUpdate,
    onDelete,
    onNewBullet,
    onIndent,
    onOutdent,
    onNavigate,
  });

  const { sourceId, handlePaste, handleCopy } = useClipboardHandlers({
    mode,
    bullet,
  });

  useEffect(() => {
    if (!contentRef.current) return;
    
    // Store current selection
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    const previousPos = range?.startOffset || 0;
    
    // Update content
    contentRef.current.textContent = bullet.content;
    
    // Restore cursor position
    if (document.activeElement === contentRef.current) {
      requestAnimationFrame(() => {
        try {
          const textNode = contentRef.current?.firstChild || contentRef.current;
          if (textNode) {
            const newRange = document.createRange();
            const pos = Math.min(previousPos, (textNode.textContent || '').length);
            newRange.setStart(textNode, pos);
            newRange.setEnd(textNode, pos);
            selection?.removeAllRanges();
            selection?.addRange(newRange);
          }
        } catch (err) {
          console.error('Failed to restore cursor position:', err);
        }
      });
    }
  }, [bullet.content]);

  const handleInput = () => {
    if (mode === "theirs") return;
    const content = contentRef.current?.textContent || "";
    onUpdate(bullet.id, content);
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
        <div
          ref={contentRef}
          className={`bullet-content ${mode === "theirs" ? "theirs-mode" : ""} py-1`}
          contentEditable={mode !== "theirs"}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onCopy={handleCopy}
          suppressContentEditableWarning
        />
        {sourceId && mode === "yours" && (
          <BulletSourceLink sourceId={sourceId} onZoom={onZoom} />
        )}
      </BulletWrapper>
    </>
  );
};

export default BulletContent;