import React, { useRef, KeyboardEvent } from "react";
import { handleTabKey, handleArrowKeys } from "@/utils/keyboardHandlers";

interface EditableContentProps {
  content: string;
  onUpdate: (content: string) => void;
  onDelete: () => void;
  onNewBullet: () => void;
  onNavigate: (direction: "up" | "down") => void;
  onIndent?: () => void;
  onOutdent?: () => void;
}

const EditableContent: React.FC<EditableContentProps> = ({
  content,
  onUpdate,
  onDelete,
  onNewBullet,
  onNavigate,
  onIndent,
  onOutdent,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.textContent = content;
  }, [content]);

  const handleKeyDown = (e: KeyboardEvent) => {
    const content = contentRef.current?.textContent || "";
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    const pos = range?.startOffset || 0;

    if (e.key === "Enter") {
      e.preventDefault();
      onNewBullet();
    } else if (e.key === "Tab") {
      handleTabKey(e, content, { content }, pos, onUpdate, onIndent, onOutdent);
    } else if (e.key === "Backspace" && pos === 0 && content.length === 0) {
      e.preventDefault();
      onDelete();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      handleArrowKeys(e, content, { content }, onUpdate, onNavigate);
    }
  };

  const handleInput = () => {
    const content = contentRef.current?.textContent || "";
    onUpdate(content);
  };

  return (
    <div
      ref={contentRef}
      className="bullet-content py-1"
      contentEditable
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      suppressContentEditableWarning
    />
  );
};

export default EditableContent;