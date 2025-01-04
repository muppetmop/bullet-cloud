import React from 'react';

interface BulletIconProps {
  onZoom: () => void;
}

export const BulletIcon: React.FC<BulletIconProps> = ({ onZoom }) => {
  return (
    <span 
      className="w-4 h-4 inline-flex items-center justify-center mt-1 cursor-pointer bullet-icon"
      onClick={onZoom}
    >
      ◉
    </span>
  );
};