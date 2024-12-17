export const handleTabKey = (
  e: React.KeyboardEvent,
  content: string,
  pos: number,
  onUpdate: (content: string) => void,
  onIndent?: () => void,
  onOutdent?: () => void
) => {
  e.preventDefault();
  if (e.shiftKey) {
    onOutdent?.();
  } else {
    onIndent?.();
  }
};

export const handleArrowKeys = (
  e: React.KeyboardEvent,
  content: string,
  onUpdate: (content: string) => void,
  onNavigate: (direction: "up" | "down") => void
) => {
  const selection = window.getSelection();
  const range = selection?.getRangeAt(0);
  const pos = range?.startOffset || 0;

  if (e.key === "ArrowUp") {
    if (pos === 0) {
      e.preventDefault();
      onNavigate("up");
    }
  } else if (e.key === "ArrowDown") {
    if (pos === content.length) {
      e.preventDefault();
      onNavigate("down");
    }
  }
};