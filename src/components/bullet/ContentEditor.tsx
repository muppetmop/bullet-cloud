import React, { useRef, useEffect } from 'react';
import { isTouchDevice } from '@/utils/deviceDetection';

interface ContentEditorProps {
  content: string;
  onUpdate: (content: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const ContentEditor: React.FC<ContentEditorProps> = ({
  content,
  onUpdate,
  onKeyDown,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const isTouch = isTouchDevice();

  useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.textContent = content;
  }, [content]);

  const handleInput = () => {
    const newContent = contentRef.current?.textContent || "";
    onUpdate(newContent);
  };

  return (
    <div
      ref={contentRef}
      className="bullet-content py-1"
      contentEditable
      onInput={handleInput}
      onKeyDown={onKeyDown}
      suppressContentEditableWarning
      style={{
        direction: isTouch ? 'ltr' : 'inherit', // Force LTR on touch devices
        userSelect: 'text',
        WebkitUserSelect: 'text',
      }}
    />
  );
};

export default ContentEditor;