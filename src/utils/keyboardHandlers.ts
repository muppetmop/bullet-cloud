import { BulletPoint } from "@/types/bullet";
import { isTouchDevice } from "./deviceDetection";

export const handleTabKey = (
  e: React.KeyboardEvent,
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

  // Only attempt to restore cursor position on desktop
  if (!isTouchDevice()) {
    requestAnimationFrame(() => {
      const element = document.querySelector(
        `[data-id="${bullet.id}"] .bullet-content`
      ) as HTMLElement;
      if (element) {
        element.focus();
        try {
          const range = document.createRange();
          const selection = window.getSelection();
          const textNode = element.firstChild || element;
          range.setStart(textNode, pos);
          range.setEnd(textNode, pos);
          selection?.removeAllRanges();
          selection?.addRange(range);
        } catch (err) {
          console.error('Failed to restore cursor position:', err);
        }
      }
    });
  }
};

export const handleArrowKeys = (
  e: React.KeyboardEvent,
  content: string,
  bullet: BulletPoint,
  onUpdate: (id: string, content: string) => void,
  onNavigate: (direction: "up" | "down", id: string) => void
) => {
  e.preventDefault();
  onUpdate(bullet.id, content);
  onNavigate(e.key === "ArrowUp" ? "up" : "down", bullet.id);
};