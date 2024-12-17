import React from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

interface BulletIconProps {
  hasChildren: boolean;
  isCollapsed: boolean;
  onCollapse: () => void;
  onZoom: () => void;
}

const BulletIcon: React.FC<BulletIconProps> = ({
  hasChildren,
  isCollapsed,
  onCollapse,
  onZoom,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      onCollapse();
    }
    onZoom();
  };

  return (
    <>
      {hasChildren ? (
        <button
          className="collapse-button mt-1"
          onClick={handleClick}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      ) : (
        <span 
          className="w-4 h-4 inline-flex items-center justify-center mt-1 cursor-pointer"
          onClick={handleClick}
        >
          •
        </span>
      )}
    </>
  );
};

export default BulletIcon;