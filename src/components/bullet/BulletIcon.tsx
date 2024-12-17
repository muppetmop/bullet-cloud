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
  return (
    <div className="flex items-center gap-1">
      {hasChildren && (
        <button
          className="collapse-button"
          onClick={onCollapse}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      )}
      <span className="w-4 h-4 inline-flex items-center justify-center">
        •
      </span>
    </div>
  );
};

export default BulletIcon;