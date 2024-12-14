import React from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

interface BulletActionsProps {
  hasChildren: boolean;
  isCollapsed: boolean;
  onCollapse: () => void;
}

const BulletActions: React.FC<BulletActionsProps> = ({
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

export default BulletActions;