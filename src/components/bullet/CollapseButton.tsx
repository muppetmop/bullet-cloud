import React from 'react';

interface CollapseButtonProps {
  isCollapsed: boolean;
  hasChildren: boolean;
  onCollapse: () => void;
}

const CollapseButton: React.FC<CollapseButtonProps> = ({
  isCollapsed,
  hasChildren,
  onCollapse
}) => {
  if (!hasChildren) return null;

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

export default CollapseButton;