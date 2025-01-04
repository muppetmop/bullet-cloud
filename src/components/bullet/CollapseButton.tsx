import React from 'react';

interface CollapseButtonProps {
  isCollapsed: boolean;
  onCollapse: () => void;
}

export const CollapseButton: React.FC<CollapseButtonProps> = ({ 
  isCollapsed, 
  onCollapse 
}) => {
  return (
    <button
      className="collapse-button"
      onClick={onCollapse}
    >
      {isCollapsed ? (
        <span className="text-gray-400">▶</span>
      ) : (
        <span className="text-gray-400">▼</span>
      )}
    </button>
  );
};