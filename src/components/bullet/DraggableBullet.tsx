import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DraggableBulletProps {
  id: string;
  children: React.ReactNode;
}

const DraggableBullet: React.FC<DraggableBulletProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        {...listeners}
        className="absolute left-[-1.5rem] top-[0.45rem] w-4 h-4 cursor-grab active:cursor-grabbing"
      >
        ⋮
      </div>
      {children}
    </div>
  );
};

export default DraggableBullet;