import React, { useRef, KeyboardEvent } from "react";
import { BulletPoint } from "@/types/bullet";

interface BulletEditorProps {
  content: string;
  onUpdate: (content: string) => void;
  onKeyDown: (e: KeyboardEvent, content: string, pos: number) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onCopy: (e: React.ClipboardEvent) => void;
  isEditable: boolean;
  className?: string;
}

const BulletEditor: React.FC<BulletEditorProps> = ({
  content,
  onUpdate,
  onKeyDown,
  onPaste,
  onCopy,
  isEditable,
  className = "",
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.textContent = content;
  }, [content]);

  const handleInput = () => {
    if (!isEditable) return;
    const content = contentRef.current?.textContent || "";
    onUpdate(content);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isEditable) return;
    const content = contentRef.current?.textContent || "";
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    const pos = range?.startOffset || 0;
    onKeyDown(e, content, pos);
  };

  return (
    <div
      ref={contentRef}
      className={`bullet-content ${!isEditable ? "theirs-mode" : ""} py-1 ${className}`}
      contentEditable={isEditable}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={onPaste}
      onCopy={onCopy}
      suppressContentEditableWarning
    />
  );
};

export default BulletEditor;