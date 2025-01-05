import React, { useEffect, useState } from 'react';

interface CollapsedState {
  [key: string]: boolean;
}

interface CollapsedStateManagerProps {
  mode: "yours" | "theirs";
  onStateChange: (state: CollapsedState) => void;
}

const CollapsedStateManager: React.FC<CollapsedStateManagerProps> = ({
  mode,
  onStateChange
}) => {
  const [collapsedState, setCollapsedState] = useState<CollapsedState>(() => {
    const key = `${mode}CollapsedState`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    const key = `${mode}CollapsedState`;
    localStorage.setItem(key, JSON.stringify(collapsedState));
    onStateChange(collapsedState);
  }, [collapsedState, mode, onStateChange]);

  return null;
};

export default CollapsedStateManager;