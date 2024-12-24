import { useState } from "react";

interface ClipboardHandlerProps {
  mode: "yours" | "theirs";
  bullet: { parent_id: string | null; id: string; };
}

export const useClipboardHandlers = ({ mode, bullet }: ClipboardHandlerProps) => {
  const [sourceId, setSourceId] = useState<string | null>(null);

  const handlePaste = (e: React.ClipboardEvent) => {
    if (mode === "theirs") return;
    
    // Get the source bullet ID from the clipboard data
    const sourceId = e.clipboardData.getData('text/bullet-source');
    if (sourceId) {
      setSourceId(sourceId);
    }
  };

  const handleCopy = (e: React.ClipboardEvent) => {
    if (mode === "theirs") {
      // Store the parent ID in the clipboard data
      e.clipboardData.setData('text/bullet-source', bullet.parent_id || bullet.id);
      e.preventDefault();
      
      // Get the selected text
      const selection = window.getSelection();
      if (selection) {
        e.clipboardData.setData('text/plain', selection.toString());
      }
    }
  };

  return {
    sourceId,
    handlePaste,
    handleCopy
  };
};