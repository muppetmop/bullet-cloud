import React, { useRef, useEffect } from "react";

interface BulletInputProps {
  content: string;
  onInput: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const BulletInput: React.FC<BulletInputProps> = ({
  content,
  onInput,
  onKeyDown,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.textContent = content;
  }, [content]);

  return (
    <div
      ref={contentRef}
      className="bullet-content py-1"
      contentEditable
      onInput={onInput}
      onKeyDown={onKeyDown}
      suppressContentEditableWarning
    />
  );
};

export default BulletInput;