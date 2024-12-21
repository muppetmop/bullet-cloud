import React, { useRef, useEffect, useCallback } from 'react';
import { isTouchDevice } from '@/utils/deviceDetection';

interface ContentEditorProps {
  content: string;
  onUpdate: (content: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const ContentEditor: React.FC<ContentEditorProps> = ({
  content,
  onUpdate,
  onKeyDown
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const isTouch = isTouchDevice();
  const lastContentRef = useRef(content);

  useEffect(() => {
    if (!contentRef.current) return;
    if (contentRef.current.textContent !== content) {
      contentRef.current.textContent = content;
    }
  }, [content]);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.textContent || "";
    if (newContent !== lastContentRef.current) {
      lastContentRef.current = newContent;
      onUpdate(newContent);
    }
  }, [onUpdate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // On mobile, let the browser handle most key events naturally
    if (isTouch && !['Enter', 'Backspace', 'Tab'].includes(e.key)) {
      return;
    }
    onKeyDown(e);
  }, [isTouch, onKeyDown]);

  return (
    <div
      ref={contentRef}
      className="bullet-content py-1"
      contentEditable
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      suppressContentEditableWarning
      dir="ltr"
    />
  );
};

export default ContentEditor;