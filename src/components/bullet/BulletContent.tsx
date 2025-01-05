import React, { useRef, KeyboardEvent, useEffect, useLayoutEffect } from "react";
import { BulletPoint } from "@/types/bullet";
import { handleTabKey, handleArrowKeys } from "@/utils/keyboardHandlers";
import { BulletIcon } from "./BulletIcon";
import { CollapseButton } from "./CollapseButton";
import { useCaretPosition } from "@/hooks/useCaretPosition";

interface BulletContentProps {
  bullet: BulletPoint;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onNewBullet: (id: string) => Promise<string | null>;
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
  const localContentRef = useRef<string>(bullet.content);
  const isUpdatingRef = useRef<boolean>(false);

  // Use useLayoutEffect to ensure DOM updates happen synchronously
  useLayoutEffect(() => {
    if (isUpdatingRef.current) return;

    console.log('Effect: Updating content refs:', {
      bulletId: bullet.id,
      newContent: bullet.content,
      previousLocalContent: localContentRef.current,
      domContent: contentRef.current?.textContent,
      isUpdating: isUpdatingRef.current
    });

    if (!contentRef.current) return;
    contentRef.current.textContent = bullet.content;
    localContentRef.current = bullet.content;
  }, [bullet.content]);

  const updateDOMContent = (newContent: string) => {
    if (!contentRef.current) {
      console.warn('DOM Update Failed: contentRef is null', {
        bulletId: bullet.id,
        attemptedContent: newContent
      });
      return;
    }
    
    isUpdatingRef.current = true;
    
    console.log('Before DOM Update:', {
      bulletId: bullet.id,
      currentDOMContent: contentRef.current.textContent,
      currentLocalContent: localContentRef.current,
      newContent: newContent
    });
    
    // Update both refs synchronously
    contentRef.current.textContent = newContent;
    localContentRef.current = newContent;
    
    // Force immediate DOM update
    const display = contentRef.current.style.display;
    contentRef.current.style.display = 'none';
    void contentRef.current.offsetHeight; // Force reflow
    contentRef.current.style.display = display;
    
    console.log('After DOM Update:', {
      bulletId: bullet.id,
      updatedDOMContent: contentRef.current.textContent,
      updatedLocalContent: localContentRef.current,
      displayStyle: contentRef.current.style.display
    });

    // Reset the updating flag after a short delay
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 0);
  };

  const handleKeyDown = async (e: KeyboardEvent) => {
    if (mode === "theirs") return;
    
    const content = contentRef.current?.textContent || "";
    saveCaretPosition();
    const pos = currentPosition();

    if (e.key === "Enter") {
      e.preventDefault();
      const beforeCursor = content.slice(0, pos);
      const afterCursor = content.slice(pos);
      
      console.log('Enter key pressed:', {
        bulletId: bullet.id,
        fullContent: content,
        beforeCursor,
        afterCursor,
        cursorPos: pos,
        domContent: contentRef.current?.textContent,
        localContent: localContentRef.current
      });

      // Set updating flag before content update
      isUpdatingRef.current = true;

      // Immediately update DOM with content before cursor
      updateDOMContent(beforeCursor);

      // Log state right after visual update
      console.log('State after visual update:', {
        bulletId: bullet.id,
        domContent: contentRef.current?.textContent,
        localContent: localContentRef.current
      });

      // Handle async operations after visual update
      await onUpdate(bullet.id, beforeCursor);
      
      const newBulletId = await onNewBullet(bullet.id);
      if (newBulletId) {
        await onUpdate(newBulletId, afterCursor);
        
        if (bullet.children.length > 0 && onTransferChildren) {
          onTransferChildren(bullet.id, newBulletId);
        }

        // Reset updating flag before focusing new bullet
        isUpdatingRef.current = false;

        requestAnimationFrame(() => {
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
        });
      }
    } else if (e.key === "Tab") {
      handleTabKey(e, content, bullet, pos, onUpdate, onIndent, onOutdent);
    } else if (e.key === "Backspace" && pos === 0) {
      const selection = window.getSelection();
      
      if (selection && !selection.isCollapsed) {
        return;
      }
      
      const visibleBullets = Array.from(
        document.querySelectorAll('.bullet-content')
      ) as HTMLElement[];
      
      const currentIndex = visibleBullets.findIndex(
        el => el === contentRef.current
      );
      
      if (currentIndex > 0) {
        e.preventDefault();
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
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      handleArrowKeys(e, content, bullet, onUpdate, onNavigate);
    }
  };

  const handleInput = () => {
    if (mode === "theirs") return;
    
    console.log('Input event:', {
      bulletId: bullet.id,
      domContent: contentRef.current?.textContent,
      localContent: localContentRef.current
    });
    
    saveCaretPosition();
    const content = contentRef.current?.textContent || "";
    localContentRef.current = content;
    onUpdate(bullet.id, content);
    
    requestAnimationFrame(() => {
      restoreCaretPosition();
      console.log('After input update:', {
        bulletId: bullet.id,
        domContent: contentRef.current?.textContent,
        localContent: localContentRef.current
      });
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
