import React, { useRef, KeyboardEvent, useEffect } from "react";
import { BulletPoint } from "@/types/bullet";
import { handleTabKey, handleArrowKeys } from "@/utils/keyboardHandlers";
import { BulletIcon } from "./BulletIcon";
import { CollapseButton } from "./CollapseButton";
import { useCaretPosition } from "@/hooks/useCaretPosition";

interface BulletContentProps {
  bullet: BulletPoint;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onNewBullet: (id: string) => string | null;
  onCollapse: (id: string) => void;
  onNavigate: (direction: "up" | "down", id: string) => void;
  onIndent?: (id: string) => void;
  onOutdent?: (id: string) => void;
  onZoom: (id: string) => void;
  mode?: "yours" | "theirs";
  onTransferChildren?: (fromBulletId: string, toBulletId: string) => void;
}

const BulletContent: React.FC<BulletContentProps> = ({
  bullet,
  onUpdate,
  onDelete,
  onNewBullet,
  onCollapse,
  onNavigate,
  onIndent,
  onOutdent,
  onZoom,
  mode = "yours",
  onTransferChildren,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const { saveCaretPosition, restoreCaretPosition, currentPosition } = useCaretPosition(contentRef);
  const skipNextInputRef = useRef(false);
  const lastContentRef = useRef(bullet.content);
  const isSplittingRef = useRef(false);
  const justSplitRef = useRef<string | null>(null);

  useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.textContent = bullet.content;
    if (!isSplittingRef.current) {
      lastContentRef.current = bullet.content;
    }
  }, [bullet.content]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (mode === "theirs") return;
    
    const content = contentRef.current?.textContent || "";
    saveCaretPosition();
    const pos = currentPosition();

    console.log('KeyDown Event:', {
      key: e.key,
      bulletId: bullet.id,
      content,
      cursorPosition: pos,
      bulletChildren: bullet.children.length,
      skipNextInput: skipNextInputRef.current,
      isSplitting: isSplittingRef.current,
      justSplit: justSplitRef.current
    });

    if (e.key === "Enter") {
      e.preventDefault();
      console.log('Enter pressed:', {
        beforeSplit: {
          content,
          cursorPosition: pos,
          bulletId: bullet.id
        }
      });

      skipNextInputRef.current = true;
      isSplittingRef.current = true;
      
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
        justSplitRef.current = newBulletId; // Track the newly created bullet
        
        if (bullet.children.length > 0 && onTransferChildren) {
          console.log('Transferring children:', {
            fromBulletId: bullet.id,
            toBulletId: newBulletId,
            childrenCount: bullet.children.length
          });
          onTransferChildren(bullet.id, newBulletId);
        }

        // Handle focus based on cursor position
        requestAnimationFrame(() => {
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
          isSplittingRef.current = false;
          lastContentRef.current = beforeCursor;
        });
      }
    } else if (e.key === "Tab") {
      handleTabKey(e, content, bullet, pos, onUpdate, onIndent, onOutdent);
      justSplitRef.current = null; // Reset split tracking on any other key
    } else if (e.key === "Backspace") {
      console.log('Backspace pressed:', {
        bulletId: bullet.id,
        content,
        cursorPosition: pos,
        skipNextInput: skipNextInputRef.current,
        justSplit: justSplitRef.current
      });

      const selection = window.getSelection();
      
      if (selection && !selection.isCollapsed) {
        console.log('Text is selected, allowing default backspace behavior');
        justSplitRef.current = null; // Reset split tracking
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
            currentContent: content,
            isJustSplit: justSplitRef.current === bullet.id
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
              // Special handling for just-split bullets
              if (justSplitRef.current === bullet.id) {
                console.log('Handling backspace for just-split bullet');
                e.preventDefault();
                
                // Update previous bullet first
                onUpdate(previousBulletId, previousContent + content);
                
                // Wait for the update to complete before deleting
                setTimeout(() => {
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
                }, 100);
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
      }
      justSplitRef.current = null; // Reset split tracking after backspace
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      handleArrowKeys(e, content, bullet, onUpdate, onNavigate);
      justSplitRef.current = null; // Reset split tracking on any other key
    } else {
      justSplitRef.current = null; // Reset split tracking on any other key
    }
  };

  const handleInput = () => {
    if (mode === "theirs") return;
    if (skipNextInputRef.current) {
      console.log('Skipping input handler due to skipNextInputRef');
      skipNextInputRef.current = false;
      return;
    }
    saveCaretPosition();
    const content = contentRef.current?.textContent || lastContentRef.current;
    console.log('Input handler:', {
      bulletId: bullet.id,
      newContent: content,
      previousContent: lastContentRef.current,
      isSplitting: isSplittingRef.current
    });
    onUpdate(bullet.id, content);
    if (!isSplittingRef.current) {
      lastContentRef.current = content;
    }
    requestAnimationFrame(() => {
      restoreCaretPosition();
    });
  };

  return (
    <>
      {bullet.children.length > 0 && (
        <CollapseButton
          isCollapsed={bullet.isCollapsed}
          onCollapse={() => onCollapse(bullet.id)}
        />
      )}
      <div className={`bullet-wrapper ${mode === "theirs" ? "theirs-mode" : ""}`}>
        <BulletIcon onZoom={() => onZoom(bullet.id)} />
        <div
          ref={contentRef}
          className={`bullet-content ${mode === "theirs" ? "theirs-mode" : ""} py-1`}
          contentEditable={mode !== "theirs"}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          suppressContentEditableWarning
        />
      </div>
    </>
  );
};

export default BulletContent;