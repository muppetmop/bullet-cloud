import React, { useRef, KeyboardEvent, useEffect } from "react";
import { BulletPoint } from "@/types/bullet";
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
  const splitTimestampRef = useRef<number | null>(null);

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
      splitTimestamp: splitTimestampRef.current,
      timeSinceSplit: splitTimestampRef.current ? Date.now() - splitTimestampRef.current : null,
      timestamp: new Date().toISOString(),
      contentRefExists: !!contentRef.current,
      selectionState: window.getSelection()?.toString() || 'No selection'
    });

    if (e.key === "Enter") {
      e.preventDefault();
      console.log('Enter pressed:', {
        beforeSplit: {
          content,
          cursorPosition: pos,
          bulletId: bullet.id,
          timestamp: new Date().toISOString()
        }
      });

      skipNextInputRef.current = true;
      isSplittingRef.current = true;
      splitTimestampRef.current = Date.now();
      
      const beforeCursor = content.slice(0, pos);
      const afterCursor = content.slice(pos);
      
      console.log('Content split:', {
        beforeCursor,
        afterCursor,
        originalContent: content,
        timestamp: new Date().toISOString()
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
        contentToMove: afterCursor,
        timestamp: new Date().toISOString()
      });
      
      if (newBulletId) {
        onUpdate(newBulletId, afterCursor);
        
        if (bullet.children.length > 0 && onTransferChildren) {
          console.log('Transferring children:', {
            fromBulletId: bullet.id,
            toBulletId: newBulletId,
            childrenCount: bullet.children.length,
            timestamp: new Date().toISOString()
          });
          onTransferChildren(bullet.id, newBulletId);
        }

        // Handle focus movement
        console.log('Moving focus to new bullet:', {
          newBulletId,
          timestamp: new Date().toISOString()
        });
        
        requestAnimationFrame(() => {
          const newElement = document.querySelector(
            `[data-id="${newBulletId}"] .bullet-content`
          ) as HTMLElement;
          
          console.log('Focus movement attempt:', {
            newElementFound: !!newElement,
            timestamp: new Date().toISOString()
          });
          
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
              
              console.log('Focus and cursor position set:', {
                success: true,
                timestamp: new Date().toISOString()
              });
            } catch (err) {
              console.error('Failed to set cursor position:', err);
            }
          }
          isSplittingRef.current = false;
        });
      }
    } else if (e.key === "Backspace") {
      console.log('Backspace pressed:', {
        bulletId: bullet.id,
        content,
        cursorPosition: pos,
        skipNextInput: skipNextInputRef.current,
        timestamp: new Date().toISOString()
      });

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
          hasContent: content.length > 0,
          timestamp: new Date().toISOString()
        });
        
        if (currentIndex > 0) {
          const previousElement = visibleBullets[currentIndex - 1];
          const previousContent = previousElement.textContent || '';
          const previousBulletId = previousElement.closest('[data-id]')?.getAttribute('data-id');
          
          console.log('Previous bullet found:', {
            previousBulletId,
            previousContent,
            currentContent: content,
            timeSinceSplit: splitTimestampRef.current ? Date.now() - splitTimestampRef.current : null,
            timestamp: new Date().toISOString()
          });
          
          if (previousBulletId) {
            if (content.length === 0) {
              console.log('Empty bullet deletion:', {
                bulletId: bullet.id,
                previousBulletId,
                timestamp: new Date().toISOString()
              });
              
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
                    
                    console.log('Focus returned to previous bullet:', {
                      success: true,
                      position,
                      timestamp: new Date().toISOString()
                    });
                  } catch (err) {
                    console.error('Failed to set cursor position:', err);
                  }
                });
              }
            } else {
              console.log('Normal backspace merge:', {
                fromBulletId: bullet.id,
                toBulletId: previousBulletId,
                timestamp: new Date().toISOString()
              });
              
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
                  
                  console.log('Merge complete, focus set:', {
                    success: true,
                    position,
                    timestamp: new Date().toISOString()
                  });
                } catch (err) {
                  console.error('Failed to set cursor position:', err);
                }
              });
            }
          }
        }
      }
    } else if (e.key === "Tab") {
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
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      onUpdate(bullet.id, content);
      onNavigate(e.key === "ArrowUp" ? "up" : "down", bullet.id);
    }
  };

  const handleInput = () => {
    if (mode === "theirs") return;
    if (skipNextInputRef.current) {
      console.log('Skipping input handler:', {
        bulletId: bullet.id,
        timestamp: new Date().toISOString()
      });
      skipNextInputRef.current = false;
      return;
    }
    saveCaretPosition();
    const content = contentRef.current?.textContent || lastContentRef.current;
    console.log('Input handler:', {
      bulletId: bullet.id,
      newContent: content,
      previousContent: lastContentRef.current,
      isSplitting: isSplittingRef.current,
      timestamp: new Date().toISOString()
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