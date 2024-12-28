import { BulletPoint } from "@/types/bullet";
import { RefObject } from "react";

export const useKeyboardHandlers = (
  contentRef: RefObject<HTMLDivElement>,
  bullet: BulletPoint,
  mode: "yours" | "theirs",
  onUpdate: (id: string, content: string) => void,
  onDelete: (id: string) => void,
  onNewBullet: (id: string) => string | null,
  onNavigate: (direction: "up" | "down", id: string) => void,
  onIndent?: (id: string) => void,
  onOutdent?: (id: string) => void,
  onTransferChildren?: (fromBulletId: string, toBulletId: string) => void,
) => {
  const handleEnterKey = (e: React.KeyboardEvent, content: string, pos: number) => {
    if (mode === "theirs") return;
    
    e.preventDefault();
    console.log('Enter pressed:', {
      bulletId: bullet.id,
      content,
      cursorPosition: pos,
      bulletChildren: bullet.children.length
    });

    // Split content at cursor position
    const beforeCursor = content.slice(0, pos);
    const afterCursor = content.slice(pos);
    
    console.log('Content split:', {
      beforeCursor,
      afterCursor,
      originalContent: content
    });

    // First update the original bullet to only keep content before cursor
    if (contentRef.current) {
      contentRef.current.textContent = beforeCursor;
    }
    onUpdate(bullet.id, beforeCursor);
    
    // Create new bullet with content after cursor
    const newBulletId = onNewBullet(bullet.id);
    
    console.log('New bullet created:', {
      newBulletId,
      contentToMove: afterCursor
    });
    
    if (newBulletId) {
      onUpdate(newBulletId, afterCursor);
      
      // Handle children transfer if needed
      if (bullet.children.length > 0 && onTransferChildren) {
        console.log('Transferring children:', {
          fromBulletId: bullet.id,
          toBulletId: newBulletId,
          childrenCount: bullet.children.length
        });
        onTransferChildren(bullet.id, newBulletId);
      }

      // Handle focus based on cursor position
      if (pos === 0) {
        console.log('Cursor at start, keeping focus on original bullet:', bullet.id);
        const originalElement = document.querySelector(
          `[data-id="${bullet.id}"] .bullet-content`
        ) as HTMLElement;
        
        if (originalElement) {
          originalElement.focus();
          try {
            const selection = window.getSelection();
            const range = document.createRange();
            const textNode = originalElement.firstChild || originalElement;
            range.setStart(textNode, 0);
            range.setEnd(textNode, 0);
            selection?.removeAllRanges();
            selection?.addRange(range);
          } catch (err) {
            console.error('Failed to set cursor position:', err);
          }
        }
      } else {
        console.log('Moving focus to new bullet:', newBulletId);
        const newElement = document.querySelector(
          `[data-id="${newBulletId}"] .bullet-content`
        ) as HTMLElement;
        
        if (newElement) {
          newElement.focus();
          try {
            const selection = window.getSelection();
            const range = document.createRange();
            const textNode = newElement.firstChild || newElement;
            range.setStart(textNode, 0);
            range.setEnd(textNode, 0);
            selection?.removeAllRanges();
            selection?.addRange(range);
          } catch (err) {
            console.error('Failed to set cursor position:', err);
          }
        }
      }
    }
  };

  const handleBackspaceKey = (e: React.KeyboardEvent, content: string, pos: number) => {
    if (mode === "theirs") return;

    console.log('Backspace pressed:', {
      bulletId: bullet.id,
      content,
      cursorPosition: pos
    });

    const selection = window.getSelection();
    
    if (selection && !selection.isCollapsed) {
      console.log('Text is selected, allowing default backspace behavior');
      return;
    }
    
    if (pos === 0) {
      const visibleBullets = Array.from(
        document.querySelectorAll('.bullet-content')
      ) as HTMLElement[];
      
      const currentIndex = visibleBullets.findIndex(
        el => el === contentRef.current
      );
      
      console.log('Cursor at start of line:', {
        currentIndex,
        totalBullets: visibleBullets.length,
        hasContent: content.length > 0
      });
      
      if (currentIndex > 0) {
        const previousElement = visibleBullets[currentIndex - 1];
        const previousContent = previousElement.textContent || '';
        const previousBulletId = previousElement.closest('[data-id]')?.getAttribute('data-id');
        
        console.log('Previous bullet found:', {
          previousBulletId,
          previousContent,
          currentContent: content
        });
        
        if (previousBulletId) {
          if (content.length === 0) {
            console.log('Current bullet is empty, attempting deletion');
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
            // Normal backspace merge behavior
            console.log('Normal backspace merge');
            e.preventDefault();
            onUpdate(previousBulletId, previousContent + content);
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
        }
      }
    }
  };

  const handleTabKey = (e: React.KeyboardEvent, content: string, pos: number) => {
    if (mode === "theirs") return;
    
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

  const handleArrowKeys = (e: React.KeyboardEvent, content: string) => {
    if (mode === "theirs") return;
    
    e.preventDefault();
    onUpdate(bullet.id, content);
    onNavigate(e.key === "ArrowUp" ? "up" : "down", bullet.id);
  };

  return {
    handleEnterKey,
    handleBackspaceKey,
    handleTabKey,
    handleArrowKeys
  };
};
