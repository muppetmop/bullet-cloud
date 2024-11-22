import { useState, useRef } from 'react';

export const useBulletDrag = () => {
  const [isDragging, setIsDragging] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const dragRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => {
    longPressTimer.current = setTimeout(() => {
      if (dragRef.current) {
        dragRef.current.draggable = true;
        setIsDragging(true);
      }
    }, 300);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleDragStart = (e: React.DragEvent, bulletId: string) => {
    e.dataTransfer.setData('text/plain', bulletId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    if (dragRef.current) {
      dragRef.current.draggable = false;
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const target = e.currentTarget as HTMLElement;

    const rect = target.getBoundingClientRect();
    const midPoint = rect.top + rect.height / 2;

    if (e.clientY < midPoint) {
      target.classList.add('drag-over-top');
      target.classList.remove('drag-over-bottom');
    } else {
      target.classList.add('drag-over-bottom');
      target.classList.remove('drag-over-top');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('drag-over-top', 'drag-over-bottom');
  };

  return {
    isDragging,
    dragRef,
    handleMouseDown,
    handleMouseUp,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
  };
};