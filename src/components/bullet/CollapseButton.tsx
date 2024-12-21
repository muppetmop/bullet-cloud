import React from "react";

interface CollapseButtonProps {
  isCollapsed: boolean;
  onCollapse: () => void;
}

const CollapseButton: React.FC<CollapseButtonProps> = ({ isCollapsed, onCollapse }) => (
  <button className="collapse-button" onClick={onCollapse}>
    {isCollapsed ? (
      <span className="text-gray-400">▶</span>
    ) : (
      <span className="text-gray-400">▼</span>
    )}
  </button>
);

export default CollapseButton;