import React, { useRef, KeyboardEvent } from "react";
import { handleTabKey, handleArrowKeys } from "@/utils/keyboardHandlers";

interface EditableContentProps {
  content: string;
  onInput: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
}

const EditableContent: React.FC<EditableContentProps> = ({
  content,
  onInput,
  onKeyDown,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
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

export default EditableContent;