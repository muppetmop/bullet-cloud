import { BulletPoint } from "@/types/bullet";

export const handleEnterKey = (
  e: React.KeyboardEvent,
  content: string,
  bullet: BulletPoint,
  onUpdate: (id: string, content: string) => void,
  onNewBullet: (id: string) => string | null
) => {
  e.preventDefault();
  onUpdate(bullet.id, content);
  const newBulletId = onNewBullet(bullet.id);
  if (newBulletId !== null) {
    setTimeout(() => {
      const newElement = document.querySelector(
        `[data-id="${newBulletId}"] .bullet-content`
      ) as HTMLElement;
      if (newElement) {
        newElement.focus();
      }
    }, 0);
  }
};

export const handleTabKey = (
  e: React.KeyboardEvent,
  content: string,
  bullet: BulletPoint,
  pos: number,
  onUpdate: (id: string, content: string) => void,
  onIndent?: (id: string) => void,
  onOutdent?: (id: string) => void
) => {
  e.preventDefault();
  onUpdate(bullet.id, content);
  
  if (e.shiftKey && onOutdent) {
    onOutdent(bullet.id);
  } else if (!e.shiftKey && onIndent) {
    onIndent(bullet.id);
  }

  setTimeout(() => {
    const element = document.querySelector(
      `[data-id="${bullet.id}"] .bullet-content`
    ) as HTMLElement;
    if (element) {
      element.focus();
      try {
        const range = document.createRange();
        const selection = window.getSelection();
        const textNode = element.firstChild || element;
        range.setStart(textNode, pos);
        range.setEnd(textNode, pos);
        selection?.removeAllRanges();
        selection?.addRange(range);
      } catch (err) {
        console.error('Failed to restore cursor position:', err);
      }
    }
  }, 0);
};

export const handleBackspaceKey = (
  e: React.KeyboardEvent,
  content: string,
  bullet: BulletPoint,
  pos: number,
  contentRef: React.RefObject<HTMLDivElement>,
  onUpdate: (id: string, content: string) => void,
  onDelete: (id: string) => void
) => {
  // Only handle backspace at the start of the line
  if (pos === 0) {
    console.log('Backspace pressed at start of line:', {
      bulletId: bullet.id,
      content,
      position: bullet.position,
      level: bullet.level,
      caretPosition: pos
    });

    // Get all visible bullet contents
    const visibleBullets = Array.from(
      document.querySelectorAll('.bullet-content')
    ) as HTMLElement[];
    
    console.log('Found visible bullets:', {
      totalBullets: visibleBullets.length,
      currentBulletContent: content,
      visibleContents: visibleBullets.map(el => ({
        content: el.textContent,
        id: el.closest('[data-id]')?.getAttribute('data-id')
      }))
    });
    
    // Find the current bullet's index
    const currentIndex = visibleBullets.findIndex(
      el => el === contentRef.current
    );
    
    console.log('Current bullet index:', {
      currentIndex,
      hasContentRef: !!contentRef.current,
      contentRefText: contentRef.current?.textContent
    });
    
    // Only proceed if we're not at the first bullet
    if (currentIndex > 0) {
      const previousElement = visibleBullets[currentIndex - 1];
      const previousContent = previousElement.textContent || '';
      const previousBulletId = previousElement.closest('[data-id]')?.getAttribute('data-id');
      
      console.log('Previous bullet found:', {
        previousBulletId,
        previousContent,
        currentContent: content,
        willMerge: content.length > 0,
        willDelete: content.length === 0
      });
      
      if (previousBulletId) {
        if (content.length === 0) {
          // If current bullet is empty, delete it and move cursor to end of previous bullet
          if (visibleBullets.length > 1 && bullet.children.length === 0) {
            console.log('Deleting empty bullet:', {
              bulletId: bullet.id,
              previousBulletId,
              previousContent
            });
            
            onDelete(bullet.id);
            
            requestAnimationFrame(() => {
              previousElement.focus();
              try {
                const selection = window.getSelection();
                const range = document.createRange();
                const textNode = previousElement.firstChild || previousElement;
                const position = previousContent.length;
                
                console.log('Setting cursor position:', {
                  targetPosition: position,
                  nodeContent: textNode.textContent,
                  success: true
                });
                
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
          // If current bullet has content, merge with previous bullet
          e.preventDefault();
          
          console.log('Merging bullets:', {
            fromBulletId: bullet.id,
            toBulletId: previousBulletId,
            mergedContent: previousContent + content,
            originalContents: {
              previous: previousContent,
              current: content
            }
          });
          
          onUpdate(previousBulletId, previousContent + content);
          
          setTimeout(() => {
            console.log('Deleting merged bullet:', {
              bulletId: bullet.id,
              content
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
              
              console.log('Setting cursor after merge:', {
                targetPosition: position,
                nodeContent: textNode.textContent,
                success: true
              });
              
              range.setStart(textNode, position);
              range.setEnd(textNode, position);
              selection?.removeAllRanges();
              selection?.addRange(range);
            } catch (err) {
              console.error('Failed to set cursor position:', err);
            }
          });
        }
      }
    }
  }
};

export const handleArrowKeys = (
  e: React.KeyboardEvent,
  content: string,
  bullet: BulletPoint,
  onUpdate: (id: string, content: string) => void,
  onNavigate: (direction: "up" | "down", id: string) => void
) => {
  e.preventDefault();
  onUpdate(bullet.id, content);
  onNavigate(e.key === "ArrowUp" ? "up" : "down", bullet.id);
};
