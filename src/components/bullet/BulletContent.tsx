import React, { useRef } from "react";
import { BulletPoint } from "@/types/bullet";
import { BulletIcon } from "./BulletIcon";
import { CollapseButton } from "./CollapseButton";
import { useCaretPosition } from "@/hooks/useCaretPosition";
import { useKeyboardHandlers } from "./handlers/useKeyboardHandlers";

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
  onTransferChildren?: (fromBulletId: string, toBulletId: string) => void;
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
  onTransferChildren,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const { saveCaretPosition, currentPosition } = useCaretPosition(contentRef);
  const skipNextInputRef = useRef(false);

  const {
    handleEnterKey,
    handleBackspaceKey,
    handleTabKey,
    handleArrowKeys
  } = useKeyboardHandlers(
    contentRef,
    bullet,
    mode,
    onUpdate,
    onDelete,
    onNewBullet,
    onNavigate,
    onIndent,
    onOutdent,
    onTransferChildren
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mode === "theirs") return;
    
    const content = contentRef.current?.textContent || "";
    saveCaretPosition();
    const pos = currentPosition();

    console.log('KeyDown Event:', {
      key: e.key,
      bulletId: bullet.id,
      content,
      cursorPosition: pos,
      bulletChildren: bullet.children.length,
      skipNextInput: skipNextInputRef.current
    });

    if (e.key === "Enter") {
      handleEnterKey(e, content, pos);
    } else if (e.key === "Backspace") {
      handleBackspaceKey(e, content, pos);
    } else if (e.key === "Tab") {
      handleTabKey(e, content, pos);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      handleArrowKeys(e, content);
    }
  };

  const handleInput = () => {
    if (mode === "theirs") return;
    if (skipNextInputRef.current) {
      console.log('Skipping input handler due to skipNextInputRef');
      skipNextInputRef.current = false;
      return;
    }
    saveCaretPosition();
    const content = contentRef.current?.textContent || "";
    console.log('Input handler:', {
      bulletId: bullet.id,
      newContent: content
    });
    onUpdate(bullet.id, content);
  };

  return (
    <>
      {bullet.children.length > 0 && (
        <CollapseButton
          isCollapsed={bullet.isCollapsed}
          onCollapse={() => onCollapse(bullet.id)}
        />
      )}
      <div className={`bullet-wrapper ${mode === "theirs" ? "theirs-mode" : ""}`}>
        <BulletIcon onZoom={() => onZoom(bullet.id)} />
        <div
          ref={contentRef}
          className={`bullet-content ${mode === "theirs" ? "theirs-mode" : ""} py-1`}
          contentEditable={mode !== "theirs"}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          suppressContentEditableWarning
        />
      </div>
    </>
  );
};

export default BulletContent;