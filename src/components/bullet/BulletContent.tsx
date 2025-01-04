import React, { useRef, KeyboardEvent } from "react";
import { BulletPoint } from "@/types/bullet";
import { BulletIcon } from "./BulletIcon";
import { CollapseButton } from "./CollapseButton";
import { useBulletHandlers } from "@/hooks/bullet/useBulletHandlers";
import { isMobileDevice } from "@/utils/deviceDetection";

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
  const { handleEnterKey, handleBackspaceKey } = useBulletHandlers({
    onUpdate,
    onDelete,
    onNewBullet,
    onTransferChildren
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (mode === "theirs") return;

    if (e.key === "Enter") {
      handleEnterKey(e, contentRef, bullet);
    } else if (e.key === "Backspace") {
      handleBackspaceKey(e, contentRef, bullet);
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey && onOutdent) {
        onOutdent(bullet.id);
      } else if (!e.shiftKey && onIndent) {
        onIndent(bullet.id);
      }
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      onNavigate(e.key === "ArrowUp" ? "up" : "down", bullet.id);
    }
  };

  const handleInput = () => {
    if (mode === "theirs") return;
    const content = contentRef.current?.textContent || "";
    onUpdate(bullet.id, content);
  };

  React.useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.textContent = bullet.content;
  }, [bullet.content]);

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