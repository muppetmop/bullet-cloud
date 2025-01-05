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
  const localContentRef = useRef<string>(bullet.content);

  useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.textContent = bullet.content;
    localContentRef.current = bullet.content;
  }, [bullet.content]);

  const handleKeyDown = async (e: KeyboardEvent) => {
    if (mode === "theirs") return;
    
    const content = contentRef.current?.textContent || "";
    saveCaretPosition();
    const pos = currentPosition();

    if (e.key === "Enter") {
      e.preventDefault();
      const beforeCursor = content.slice(0, pos);
      const afterCursor = content.slice(pos);
      
      console.log('Handling Enter key:', {
        bulletId: bullet.id,
        beforeCursor,
        afterCursor,
        cursorPos: pos
      });

      // Update local refs immediately to prevent flicker
      if (contentRef.current) {
        contentRef.current.textContent = beforeCursor;
        localContentRef.current = beforeCursor;
      }

      // First update the current bullet with content before cursor
      await onUpdate(bullet.id, beforeCursor);
      
      // Then create new bullet and update it with content after cursor
      const newBulletId = onNewBullet(bullet.id);
      if (newBulletId) {
        await onUpdate(newBulletId, afterCursor);
        
        // Handle children transfer if needed
        if (bullet.children.length > 0 && onTransferChildren) {
          onTransferChildren(bullet.id, newBulletId);
        }

        // Focus new bullet
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
    saveCaretPosition();
    const content = contentRef.current?.textContent || "";
    localContentRef.current = content;
    onUpdate(bullet.id, content);
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