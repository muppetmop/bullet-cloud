import React from "react";
import { Plus } from "lucide-react";
import { BulletPoint } from "@/types/bullet";

interface NewBulletButtonProps {
  onNewBullet: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
}

const NewBulletButton: React.FC<NewBulletButtonProps> = ({
  onNewBullet,
  onKeyDown,
}) => {
  return (
    <button
      onClick={onNewBullet}
      className="new-bullet-button w-full flex items-center gap-2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <Plus className="w-4 h-4" />
      <span className="text-sm">Add new bullet</span>
    </button>
  );
};

export default NewBulletButton;