import { BulletPoint } from "@/types/bullet";

export const handleEnterKey = (
  e: React.KeyboardEvent,
  content: string,
  bullet: BulletPoint,
  onUpdate: (id: string, content: string) => void,
  onNewBullet: (id: string) => string | null
) => {
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
};

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

  setTimeout(() => {
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
  }, 0);
};

export const handleBackspaceKey = (
  e: React.KeyboardEvent,
  content: string,
  bullet: BulletPoint,
  pos: number,
  contentRef: React.RefObject<HTMLDivElement>,
  onUpdate: (id: string, content: string) => void,
  onDelete: (id: string) => void
) => {
  if (pos === 0) {
    e.preventDefault();
    const visibleBullets = document.querySelectorAll('.bullet-content');
    const currentIndex = Array.from(visibleBullets).findIndex(
      el => el === contentRef.current
    );
    
    if (currentIndex > 0) {
      const previousElement = visibleBullets[currentIndex - 1] as HTMLElement;
      const previousContent = previousElement.textContent || '';
      
      const previousBulletId = previousElement.closest('[data-id]')?.getAttribute('data-id');
      if (previousBulletId) {
        onUpdate(previousBulletId, previousContent + content);
        onDelete(bullet.id);
        
        setTimeout(() => {
          previousElement.focus();
          const range = document.createRange();
          const selection = window.getSelection();
          const textNode = previousElement.firstChild || previousElement;
          const position = previousContent.length;
          range.setStart(textNode, position);
          range.setEnd(textNode, position);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }, 0);
      }
    } else if (!content) {
      onDelete(bullet.id);
    }
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