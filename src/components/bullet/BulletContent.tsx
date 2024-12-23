import React, { useState } from "react";
import { BulletPoint } from "@/types/bullet";
import BulletEditor from "./BulletEditor";
import { useKeyboardHandlers } from "@/hooks/bullet/useKeyboardHandlers";
import BulletWrapper from "./BulletWrapper";
import BulletSourceLink from "./BulletSourceLink";

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
  const [sourceId, setSourceId] = useState<string | null>(null);
  const keyboardHandlers = useKeyboardHandlers({
    bullet,
    onUpdate,
    onDelete,
    onNewBullet,
    onNavigate,
    onIndent,
    onOutdent,
  });

  const handleKeyDown = (e: React.KeyboardEvent, content: string, pos: number) => {
    if (mode === "theirs") return;

    if (e.key === "Enter") {
      keyboardHandlers.handleEnterKey(e, content, pos);
    } else if (e.key === "Tab") {
      keyboardHandlers.handleTabKey(e, content, pos);
    } else if (e.key === "Backspace") {
      keyboardHandlers.handleBackspaceKey(e, content, pos);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      keyboardHandlers.handleArrowKeys(e, content);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (mode === "theirs") return;
    
    const sourceId = e.clipboardData.getData('text/bullet-source');
    if (sourceId) {
      setSourceId(sourceId);
    }
  };

  const handleCopy = (e: React.ClipboardEvent) => {
    if (mode === "theirs") {
      e.clipboardData.setData('text/bullet-source', bullet.parent_id || bullet.id);
      e.preventDefault();
      
      const selection = window.getSelection();
      if (selection) {
        e.clipboardData.setData('text/plain', selection.toString());
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
      <BulletWrapper mode={mode}>
        <span 
          className="w-4 h-4 inline-flex items-center justify-center mt-1 cursor-pointer bullet-icon"
          onClick={() => onZoom(bullet.id)}
        >
          ◉
        </span>
        <BulletEditor
          content={bullet.content}
          onUpdate={(content) => onUpdate(bullet.id, content)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onCopy={handleCopy}
          isEditable={mode !== "theirs"}
        />
        {sourceId && mode === "yours" && (
          <BulletSourceLink sourceId={sourceId} onZoom={onZoom} />
        )}
      </BulletWrapper>
    </>
  );
};

export default BulletContent;