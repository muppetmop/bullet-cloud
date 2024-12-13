import React from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

interface BulletIconProps {
  hasChildren: boolean;
  isCollapsed: boolean;
  onCollapse: () => void;
}

const BulletIcon: React.FC<BulletIconProps> = ({
  hasChildren,
  isCollapsed,
  onCollapse,
}) => {
  if (hasChildren) {
    return (
      <button className="collapse-button mt-1" onClick={onCollapse}>
        {isCollapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>
    );
  }

  return (
    <span className="w-4 h-4 inline-flex items-center justify-center mt-1">•</span>
  );
};

export default BulletIcon;