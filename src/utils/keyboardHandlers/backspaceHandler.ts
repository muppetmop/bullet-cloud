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
    
    console.log('Current bullet index:', {
      index: currentIndex,
      hasContentRef: !!contentRef.current,
      currentContent: contentRef.current?.textContent,
      isContentEditable: contentRef.current?.isContentEditable,
      selection: window.getSelection()?.toString(),
      domState: {
        activeElement: document.activeElement === contentRef.current,
        selectionState: {
          anchorOffset: window.getSelection()?.anchorOffset,
          focusOffset: window.getSelection()?.focusOffset,
          isCollapsed: window.getSelection()?.isCollapsed
        }
      }
    });
    
    if (currentIndex > 0) {
      const previousElement = visibleBullets[currentIndex - 1];
      const previousContent = previousElement.textContent || '';
      const previousBulletId = previousElement.closest('[data-id]')?.getAttribute('data-id');
      
      console.log('Previous bullet found:', {
        id: previousBulletId,
        content: previousContent,
        willMerge: content.length > 0,
        willDelete: content.length === 0,
        domState: {
          isContentEditable: previousElement.isContentEditable,
          hasSelection: window.getSelection()?.containsNode(previousElement, true),
          previousElementRect: previousElement.getBoundingClientRect()
        },
        operationState: {
          isProcessing: false,
          lastOperation: null,
          timestamp: Date.now()
        }
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
              },
              state: {
                domContent: contentRef.current?.textContent,
                localContent: content,
                previousDomContent: previousElement.textContent,
                operationInProgress: false
              },
              timestamp: {
                start: Date.now(),
                lastUpdate: null
              }
            });
            
            // Set operation flag
            const operationState = {
              isDeleting: true,
              startTime: Date.now()
            };
            
            console.log('Starting delete operation:', operationState);
            
            onDelete(bullet.id);
            
            console.log('Delete operation completed:', {
              ...operationState,
              endTime: Date.now(),
              duration: Date.now() - operationState.startTime
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
                    },
                    timestamp: Date.now()
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
          
          const mergeOperation = {
            isProcessing: true,
            startTime: Date.now(),
            from: {
              id: bullet.id,
              content,
              position: bullet.position,
              domContent: contentRef.current?.textContent
            },
            to: {
              id: previousBulletId,
              content: previousContent,
              position: previousElement.closest('[data-id]')?.getAttribute('data-position'),
              domContent: previousElement.textContent
            }
          };
          
          console.log('Starting merge operation:', mergeOperation);
          
          onUpdate(previousBulletId, previousContent + content);
          
          console.log('Content merged:', {
            ...mergeOperation,
            mergedContent: previousContent + content,
            timestamp: Date.now()
          });
          
          setTimeout(() => {
            console.log('Deleting merged bullet:', {
              id: bullet.id,
              content,
              position: bullet.position,
              state: {
                domExists: !!document.querySelector(`[data-id="${bullet.id}"]`),
                localStorageContent: localStorage.getItem('bullets'),
                operationDuration: Date.now() - mergeOperation.startTime
              }
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
                finalState: {
                  domContent: previousElement.textContent,
                  selection: selection?.toString(),
                  range: {
                    startOffset: range.startOffset,
                    endOffset: range.endOffset
                  },
                  localStorageContent: localStorage.getItem('bullets'),
                  operationComplete: true,
                  duration: Date.now() - mergeOperation.startTime
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