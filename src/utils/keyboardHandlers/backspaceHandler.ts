import { BulletPoint } from "@/types/bullet";
import { toast } from "sonner";

export const handleBackspaceKey = (
  e: React.KeyboardEvent,
  content: string,
  bullet: BulletPoint,
  pos: number,
  contentRef: React.RefObject<HTMLDivElement>,
  onUpdate: (id: string, content: string) => void,
  onDelete: (id: string) => void
) => {
  if (pos === 0) {
    console.log('Backspace pressed at start:', {
      bullet: {
        id: bullet.id,
        content,
        position: bullet.position,
        level: bullet.level
      },
      caretPosition: pos,
      hasChildren: bullet.children.length > 0
    });

    const visibleBullets = Array.from(
      document.querySelectorAll('.bullet-content')
    ) as HTMLElement[];
    
    console.log('Visible bullets state:', {
      totalCount: visibleBullets.length,
      bullets: visibleBullets.map(el => ({
        id: el.closest('[data-id]')?.getAttribute('data-id'),
        content: el.textContent,
        position: el.closest('[data-id]')?.getAttribute('data-position')
      }))
    });
    
    const currentIndex = visibleBullets.findIndex(
      el => el === contentRef.current
    );
    
    console.log('Current bullet index:', {
      index: currentIndex,
      hasContentRef: !!contentRef.current,
      currentContent: contentRef.current?.textContent
    });
    
    if (currentIndex > 0) {
      const previousElement = visibleBullets[currentIndex - 1];
      const previousContent = previousElement.textContent || '';
      const previousBulletId = previousElement.closest('[data-id]')?.getAttribute('data-id');
      
      console.log('Previous bullet found:', {
        id: previousBulletId,
        content: previousContent,
        willMerge: content.length > 0,
        willDelete: content.length === 0
      });
      
      if (previousBulletId) {
        if (content.length === 0) {
          if (visibleBullets.length > 1 && bullet.children.length === 0) {
            console.log('Deleting empty bullet:', {
              bulletId: bullet.id,
              previousId: previousBulletId,
              positions: {
                current: bullet.position,
                previous: previousElement.closest('[data-id]')?.getAttribute('data-position')
              }
            });
            
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
                
                console.log('Cursor position set:', {
                  element: previousBulletId,
                  position,
                  success: true
                });
              } catch (err) {
                console.error('Failed to set cursor:', err);
                toast.error("Failed to set cursor position");
              }
            });
          }
        } else {
          e.preventDefault();
          
          console.log('Merging bullets:', {
            from: {
              id: bullet.id,
              content,
              position: bullet.position
            },
            to: {
              id: previousBulletId,
              content: previousContent,
              position: previousElement.closest('[data-id]')?.getAttribute('data-position')
            },
            mergedContent: previousContent + content
          });
          
          onUpdate(previousBulletId, previousContent + content);
          
          setTimeout(() => {
            console.log('Deleting merged bullet:', {
              id: bullet.id,
              content,
              position: bullet.position
            });
            onDelete(bullet.id);
          }, 100);
          
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
              
              console.log('Cursor position after merge:', {
                element: previousBulletId,
                position,
                success: true,
                finalContent: previousElement.textContent
              });
            } catch (err) {
              console.error('Failed to set cursor:', err);
              toast.error("Failed to set cursor position");
            }
          });
        }
      }
    }
  }
};