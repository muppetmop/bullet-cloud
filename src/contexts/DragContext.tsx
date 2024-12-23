import React, { createContext, useContext, useState, useCallback } from 'react';

interface DragContextType {
  draggedId: string | null;
  dragOverId: string | null;
  dragLevel: number;
  setDraggedId: (id: string | null) => void;
  setDragOverId: (id: string | null) => void;
  setDragLevel: (level: number) => void;
}

const DragContext = createContext<DragContextType | null>(null);

export const DragProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragLevel, setDragLevel] = useState<number>(0);

  return (
    <DragContext.Provider 
      value={{ 
        draggedId, 
        dragOverId, 
        dragLevel,
        setDraggedId, 
        setDragOverId,
        setDragLevel
      }}
    >
      {children}
    </DragContext.Provider>
  );
};

export const useDrag = () => {
  const context = useContext(DragContext);
  if (!context) {
    throw new Error('useDrag must be used within a DragProvider');
  }
  return context;
};