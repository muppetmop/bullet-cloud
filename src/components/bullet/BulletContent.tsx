import React, { useRef, KeyboardEvent, useEffect, useState } from "react";
import { BulletPoint } from "@/types/bullet";
import { ChevronRight, ChevronDown } from "lucide-react";
import { handleTabKey, handleArrowKeys } from "@/utils/keyboardHandlers";
import { useToast } from "@/hooks/use-toast";
import { performOptimisticSplit } from "@/utils/splitOperations";

interface BulletContentProps {
  bullet: BulletPoint;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onNewBullet: (id: string) => Promise<string | null>;
  onCollapse: (id: string) => void;
  onNavigate: (direction: "up" | "down", id: string) => void;
  onIndent?: (id: string) => void;
  onOutdent?: (id: string) => void;
}

interface PendingDelete {
  bulletId: string;
  previousContent: string;
  previousBulletId: string;
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
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [isProcessingSplit, setIsProcessingSplit] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.textContent = bullet.content;
  }, [bullet.content]);

  useEffect(() => {
    if (pendingDelete) {
      onDelete(pendingDelete.bulletId);
      setPendingDelete(null);
    }
  }, [pendingDelete, onDelete]);

  const handleKeyDown = async (e: KeyboardEvent) => {
    const content = contentRef.current?.textContent || "";
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    const pos = range?.startOffset || 0;

    if (e.key === "Enter" && !isProcessingSplit) {
      e.preventDefault();
      setIsProcessingSplit(true);
      
      const beforeCursor = content.slice(0, pos);
      const afterCursor = content.slice(pos);
      
      try {
        // Update original bullet content optimistically
        onUpdate(bullet.id, beforeCursor);
        
        // Create new bullet
        const newBulletId = await onNewBullet(bullet.id);
        
        if (newBulletId) {
          onUpdate(newBulletId, afterCursor);
          
          // Focus new bullet after creation
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
                toast({
                  title: "Warning",
                  description: "Failed to set cursor position",
                  variant: "destructive",
                });
              }
            }
          });
        }
      } catch (error) {
        console.error('Failed to create new bullet:', error);
        toast({
          title: "Error",
          description: "Failed to create new bullet",
          variant: "destructive",
        });
      } finally {
        setIsProcessingSplit(false);
      }
    } else if (e.key === "Tab") {
      handleTabKey(e, content, bullet, pos, onUpdate, onIndent, onOutdent);
    } else if (e.key === "Backspace") {
      handleBackspace(e, content, pos);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      handleArrowKeys(e, content, bullet, onUpdate, onNavigate);
    }
  };

  const handleBackspace = (e: KeyboardEvent, content: string, pos: number) => {
    if (pos === 0) {
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
            e.preventDefault();
            onUpdate(previousBulletId, previousContent + content);
            setPendingDelete({ 
              bulletId: bullet.id, 
              previousContent: previousContent + content,
              previousBulletId
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
              } catch (err) {
                console.error('Failed to set cursor position:', err);
              }
            });
          }
        }
      }
    }
  };

  const handleInput = () => {
    const content = contentRef.current?.textContent || "";
    onUpdate(bullet.id, content);
  };

  return (
    <div className="flex items-start gap-1">
      {bullet.children.length > 0 ? (
        <button
          className="collapse-button mt-1"
          onClick={() => onCollapse(bullet.id)}
        >
          {bullet.isCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      ) : (
        <span className="w-4 h-4 inline-flex items-center justify-center mt-1">
          •
        </span>
      )}
      <div
        ref={contentRef}
        className="bullet-content py-1"
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        suppressContentEditableWarning
      />
    </div>
  );
};

export default BulletContent;
