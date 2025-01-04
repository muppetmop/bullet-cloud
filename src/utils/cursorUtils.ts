export const getCursorPosition = (element: HTMLElement): number => {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return 0;

  const range = selection.getRangeAt(0);
  if (!element.contains(range.startContainer)) return 0;

  return range.startOffset;
};

export const setCursorPosition = (element: HTMLElement, position: number) => {
  const range = document.createRange();
  const selection = window.getSelection();
  if (!selection) return;

  const textNode = element.firstChild || element;
  try {
    range.setStart(textNode, position);
    range.setEnd(textNode, position);
    selection.removeAllRanges();
    selection.addRange(range);
  } catch (err) {
    console.error('Failed to set cursor position:', err);
  }
};

export const getTouchPosition = (element: HTMLElement, touch: Touch): number => {
  const range = document.caretRangeFromPoint(touch.clientX, touch.clientY);
  if (!range || !element.contains(range.startContainer)) return 0;
  return range.startOffset;
};