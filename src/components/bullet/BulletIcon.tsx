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
  if (!hasChildren) {
    return <div className="w-4" />;
  }

  return (
    <button
      className="collapse-button flex items-center justify-center pb-[2px]"
      onClick={onCollapse}
    >
      {isCollapsed ? (
        <ChevronRight className="w-3 h-3" />
      ) : (
        <ChevronDown className="w-3 h-3" />
      )}
    </button>
  );
};

export default BulletIcon;