import React from "react";

interface BulletIconProps {
  onZoom: () => void;
}

const BulletIcon: React.FC<BulletIconProps> = ({ onZoom }) => (
  <span 
    className="w-4 h-4 inline-flex items-center justify-center mt-1 cursor-pointer bullet-icon"
    onClick={onZoom}
  >
    ✤
  </span>
);

export default BulletIcon;