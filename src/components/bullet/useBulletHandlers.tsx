import { KeyboardEvent } from "react";
import { BulletPoint } from "@/types/bullet";
import { handleTabKey, handleArrowKeys } from "@/utils/keyboardHandlers";
import { useBackspaceHandler } from "@/hooks/bullet/useBackspaceHandler";
import { useEnterHandler } from "@/hooks/bullet/useEnterHandler";

interface BulletHandlers {
  bullet: BulletPoint;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onNewBullet: (id: string) => Promise<string | null>;
  onNavigate: (direction: "up" | "down", id: string) => void;
  onIndent?: (id: string) => void;
  onOutdent?: (id: string) => void;
}

export const useBulletHandlers = ({
  bullet,
  onUpdate,
  onDelete,
  onNewBullet,
  onNavigate,
  onIndent,
  onOutdent,
}: BulletHandlers) => {
  const { handleBackspace } = useBackspaceHandler({
    bullet,
    onDelete,
    onUpdate,
  });

  const { handleEnter, isProcessingEnter } = useEnterHandler({
    bullet,
    onUpdate,
    onNewBullet,
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    const content = (e.target as HTMLElement).textContent || "";
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    const pos = range?.startOffset || 0;

    if (e.key === "Enter" && !isProcessingEnter) {
      e.preventDefault();
      handleEnter(content, pos);
    } else if (e.key === "Tab") {
      handleTabKey(e, content, bullet, pos, onUpdate, onIndent, onOutdent);
    } else if (e.key === "Backspace") {
      handleBackspace(e, content, pos);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      handleArrowKeys(e, content, bullet, onUpdate, onNavigate);
    }
  };

  return {
    handleKeyDown,
  };
};