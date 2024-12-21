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

  const handleInput = useCallback(() => {
    const newContent = contentRef.current?.textContent || "";
    if (newContent !== lastContentRef.current) {
      lastContentRef.current = newContent;
      onUpdate(newContent);
    }
  }, [onUpdate]);

  return (
    <div
      ref={contentRef}
      className="bullet-content py-1"
      contentEditable
      onInput={handleInput}
      onKeyDown={onKeyDown}
      suppressContentEditableWarning
      dir="ltr"
    />
  );
};

export default ContentEditor;