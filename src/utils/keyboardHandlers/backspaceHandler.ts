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
  // Only handle backspace at start of line
  if (pos === 0) {
    console.log('Backspace pressed at start:', {
      bullet: {
        id: bullet.id,
        content,
        position: bullet.position,
        level: bullet.level
      },
      caretPosition: pos,
      hasChildren: bullet.children.length > 0,
      parentId: bullet.parent_id,
      domContent: contentRef.current?.textContent,
      localStorageContent: localStorage.getItem('bullets'),
      operationState: {
        isDeleting: false,
        isMerging: false,
        isUpdatingDOM: false,
        lastOperation: null
      }
    });

    const visibleBullets = Array.from(
      document.querySelectorAll('.bullet-content')
    ) as HTMLElement[];
    
    console.log('Visible bullets state:', {
      totalCount: visibleBullets.length,
      bullets: visibleBullets.map(el => ({
        id: el.closest('[data-id]')?.getAttribute('data-id'),
        content: el.textContent,
        position: el.closest('[data-id]')?.getAttribute('data-position'),
        domContent: el.textContent,
        isContentEditable: el.isContentEditable,
        hasSelection: window.getSelection()?.containsNode(el, true)
      }))
    });
    
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
            console.log('Before DOM Update (Delete):', {
              bulletId: bullet.id,
              currentDOMContent: contentRef.current?.textContent,
              currentLocalContent: content,
              operation: 'delete'
            });
            
            onDelete(bullet.id);
            
            console.log('After DOM Update (Delete):', {
              bulletId: bullet.id,
              previousId: previousBulletId,
              previousContent,
              domExists: !!document.querySelector(`[data-id="${bullet.id}"]`),
              previousElementContent: previousElement.textContent
            });
            
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
                  success: true,
                  finalState: {
                    domContent: previousElement.textContent,
                    selection: selection?.toString(),
                    range: {
                      startOffset: range.startOffset,
                      endOffset: range.endOffset
                    }
                  }
                });
              } catch (err) {
                console.error('Failed to set cursor:', err);
                toast.error("Failed to set cursor position");
              }
            });
          }
        } else {
          e.preventDefault();
          
          console.log('Before DOM Update (Merge):', {
            fromBullet: {
              id: bullet.id,
              content,
              domContent: contentRef.current?.textContent
            },
            toBullet: {
              id: previousBulletId,
              content: previousContent,
              domContent: previousElement.textContent
            },
            operation: 'merge'
          });
          
          onUpdate(previousBulletId, previousContent + content);
          
          console.log('After DOM Update (Merge):', {
            fromBullet: {
              id: bullet.id,
              content,
              domExists: !!document.querySelector(`[data-id="${bullet.id}"]`)
            },
            toBullet: {
              id: previousBulletId,
              newContent: previousContent + content,
              domContent: previousElement.textContent
            }
          });
          
          setTimeout(() => {
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
                finalState: {
                  domContent: previousElement.textContent,
                  selection: selection?.toString(),
                  range: {
                    startOffset: range.startOffset,
                    endOffset: range.endOffset
                  },
                  localStorageContent: localStorage.getItem('bullets')
                }
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