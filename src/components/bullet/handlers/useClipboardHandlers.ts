import { BulletPoint } from "@/types/bullet";

interface ClipboardHandlerProps {
  mode: "yours" | "theirs";
  bullet: BulletPoint;
}

export const useClipboardHandlers = ({ mode, bullet }: ClipboardHandlerProps) => {
  const handlePaste = (e: React.ClipboardEvent) => {
    if (mode === "theirs") {
      e.preventDefault();
      return;
    }
  };

  const handleCopy = (e: React.ClipboardEvent) => {
    if (mode === "theirs") {
      const sourceData = {
        id: bullet.id,
        parent_id: bullet.parent_id || '' // Convert null to empty string if needed
      };
      e.clipboardData.setData('text/plain', e.currentTarget.textContent || '');
      e.clipboardData.setData('application/x-bulletbook', JSON.stringify(sourceData));
      e.preventDefault();
    }
  };

  let sourceId: string | null = null;
  
  try {
    const clipboardContent = localStorage.getItem('lastCopiedBullet');
    if (clipboardContent) {
      const sourceData = JSON.parse(clipboardContent);
      sourceId = sourceData.parent_id || null;
    }
  } catch (err) {
    console.error('Failed to parse clipboard content:', err);
  }

  return {
    sourceId,
    handlePaste,
    handleCopy
  };
};