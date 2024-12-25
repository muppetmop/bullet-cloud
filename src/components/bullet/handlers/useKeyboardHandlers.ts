import { useState, useRef, KeyboardEvent } from "react";
import { BulletPoint } from "@/types/bullet";

interface PendingSplit {
  originalBulletId: string;
  beforeCursor: string;
  afterCursor: string;
  children?: BulletPoint[];
  focusOriginal?: boolean;
}

interface KeyboardHandlerProps {
  bullet: BulletPoint;
  mode: "yours" | "theirs";
  contentRef: React.RefObject<HTMLDivElement>;
  onUpdate: (id: string, content: string) => void;
  onIndent?: (id: string) => void;
  onOutdent?: (id: string) => void;
  onNavigate: (direction: "up" | "down", id: string) => void;
}

export const useKeyboardHandlers = ({
  bullet,
  mode,
  contentRef,
  onUpdate,
  onIndent,
  onOutdent,
  onNavigate,
}: KeyboardHandlerProps) => {
  const [pendingSplit, setPendingSplit] = useState<PendingSplit | null>(null);
  const [splitCompleted, setSplitCompleted] = useState(false);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (mode === "theirs") return;
    
    const content = contentRef.current?.textContent || "";
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    const pos = range?.startOffset || 0;

    if (e.key === "Enter") {
      e.preventDefault();
      const beforeCursor = content.slice(0, pos);
      const afterCursor = content.slice(pos);
      
      setPendingSplit({
        originalBulletId: bullet.id,
        beforeCursor,
        afterCursor,
        children: bullet.children,
        focusOriginal: pos === 0 && afterCursor.length > 0
      });
    } else if (e.key === "Tab") {
      handleTabKey(e, content, bullet, pos, onUpdate, onIndent, onOutdent);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      handleArrowKeys(e, content, bullet, onUpdate, onNavigate);
    }
  };

  return {
    handleKeyDown,
    pendingSplit,
    setPendingSplit,
    splitCompleted,
    setSplitCompleted
  };
};

const handleTabKey = (
  e: KeyboardEvent,
  content: string,
  bullet: BulletPoint,
  pos: number,
  onUpdate: (id: string, content: string) => void,
  onIndent?: (id: string) => void,
  onOutdent?: (id: string) => void
) => {
  e.preventDefault();
  onUpdate(bullet.id, content);
  
  if (e.shiftKey && onOutdent) {
    onOutdent(bullet.id);
  } else if (!e.shiftKey && onIndent) {
    onIndent(bullet.id);
  }
};

const handleArrowKeys = (
  e: KeyboardEvent,
  content: string,
  bullet: BulletPoint,
  onUpdate: (id: string, content: string) => void,
  onNavigate: (direction: "up" | "down", id: string) => void
) => {
  e.preventDefault();
  onUpdate(bullet.id, content);
  onNavigate(e.key === "ArrowUp" ? "up" : "down", bullet.id);
};