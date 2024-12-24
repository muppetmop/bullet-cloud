import React from 'react';
import BulletLink from './BulletLink';
import { splitTextWithUrls } from '@/utils/urlUtils';

interface BulletContentDisplayProps {
  content: string;
  mode: "yours" | "theirs";
  contentRef: React.RefObject<HTMLDivElement>;
  onInput?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onPaste?: (e: React.ClipboardEvent) => void;
  onCopy?: (e: React.ClipboardEvent) => void;
}

const BulletContentDisplay: React.FC<BulletContentDisplayProps> = ({
  content,
  mode,
  contentRef,
  onInput,
  onKeyDown,
  onPaste,
  onCopy,
}) => {
  const parts = splitTextWithUrls(content);

  React.useEffect(() => {
    if (!contentRef.current) return;

    const htmlContent = parts.map(part => 
      part.type === 'url' 
        ? `<a href="${part.content}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">${part.content}</a>`
        : part.content
    ).join('');

    contentRef.current.innerHTML = htmlContent;
  }, [content, parts]);

  return (
    <div
      ref={contentRef}
      className={`bullet-content ${mode === "theirs" ? "theirs-mode" : ""} py-1`}
      contentEditable={mode !== "theirs"}
      onInput={onInput}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      onCopy={onCopy}
      suppressContentEditableWarning
    />
  );
};

export default BulletContentDisplay;