import { useEffect, useRef } from 'react';

export const useCaretPosition = (contentRef: React.RefObject<HTMLDivElement>) => {
  const caretPositionRef = useRef<number>(0);
  
  const saveCaretPosition = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (contentRef.current?.contains(range.startContainer)) {
        caretPositionRef.current = range.startOffset;
      }
    }
  };

  const restoreCaretPosition = () => {
    if (!contentRef.current) return;
    
    try {
      const selection = window.getSelection();
      const range = document.createRange();
      
      // Find the text node
      let targetNode = contentRef.current.firstChild;
      if (!targetNode) {
        targetNode = contentRef.current;
      }
      
      // Ensure we don't exceed the text length
      const textLength = targetNode.textContent?.length || 0;
      const safePosition = Math.min(caretPositionRef.current, textLength);
      
      range.setStart(targetNode, safePosition);
      range.setEnd(targetNode, safePosition);
      
      selection?.removeAllRanges();
      selection?.addRange(range);
    } catch (err) {
      console.error('Failed to restore caret position:', err);
    }
  };

  return {
    saveCaretPosition,
    restoreCaretPosition,
    currentPosition: () => caretPositionRef.current
  };
};