import { BulletPoint } from "@/types/bullet";

export const handleBackspaceAtStart = async (
  content: string,
  bullet: BulletPoint,
  contentRef: React.RefObject<HTMLDivElement>,
  onUpdate: (id: string, content: string) => void,
  onDelete: (id: string) => void
): Promise<void> => {
  const visibleBullets = Array.from(
    document.querySelectorAll('.bullet-content')
  ) as HTMLElement[];
  
  const currentIndex = visibleBullets.findIndex(
    el => el === contentRef.current
  );
  
  if (currentIndex > 0) {
    const previousElement = visibleBullets[currentIndex - 1];
    const previousContent = previousElement.textContent || '';
    const previousBulletId = previousElement.closest('[data-id]')?.getAttribute('data-id');
    
    if (previousBulletId) {
      if (content.length === 0) {
        if (visibleBullets.length > 1 && bullet.children.length === 0) {
          onDelete(bullet.id);
          requestAnimationFrame(() => {
            previousElement.focus();
            try {
              const selection = window.getSelection();
              const range = document.createRange();
              const textNode = previousElement.firstChild || previousElement;
              const position = previousContent.length;
              range.setStart(textNode, position);
              range.setEnd(textNode, position);
              selection?.removeAllRanges();
              selection?.addRange(range);
            } catch (err) {
              console.error('Failed to set cursor position:', err);
            }
          });
        }
      } else {
        // First update the previous bullet's content
        await new Promise<void>(resolve => {
          onUpdate(previousBulletId, previousContent + content);
          // Wait for a frame to ensure the content update is processed
          requestAnimationFrame(() => resolve());
        });

        // Then focus the previous bullet
        previousElement.focus();
        try {
          const selection = window.getSelection();
          const range = document.createRange();
          const textNode = previousElement.firstChild || previousElement;
          const position = previousContent.length;
          range.setStart(textNode, position);
          range.setEnd(textNode, position);
          selection?.removeAllRanges();
          selection?.addRange(range);
        } catch (err) {
          console.error('Failed to set cursor position:', err);
        }

        // Finally delete the current bullet
        onDelete(bullet.id);
      }
    }
  }
};