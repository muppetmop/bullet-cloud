import React from 'react';
import { Plus } from "lucide-react";
import BulletList from "./BulletList";
import { BulletPoint } from "@/types/bullet";

interface BulletsViewProps {
  bullets: BulletPoint[];
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onNewBullet: (id: string) => string | null;
  onCollapse: (id: string) => void;
  onNavigate: (direction: "up" | "down", id: string) => void;
  onIndent: (id: string) => void;
  onOutdent: (id: string) => void;
  onZoom: (id: string) => void;
  handleNewBullet: () => void;
  getAllVisibleBullets: (bullets: BulletPoint[]) => BulletPoint[];
}

const BulletsView: React.FC<BulletsViewProps> = ({
  bullets,
  onUpdate,
  onDelete,
  onNewBullet,
  onCollapse,
  onNavigate,
  onIndent,
  onOutdent,
  onZoom,
  handleNewBullet,
  getAllVisibleBullets
}) => {
  return (
    <>
      <BulletList
        bullets={bullets}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onNewBullet={onNewBullet}
        onCollapse={onCollapse}
        onNavigate={onNavigate}
        onIndent={onIndent}
        onOutdent={onOutdent}
        onZoom={onZoom}
      />
      <button
        onClick={handleNewBullet}
        className="new-bullet-button w-full flex items-center gap-2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleNewBullet();
          } else if (e.key === "ArrowUp" && bullets.length > 0) {
            const lastBullet = getAllVisibleBullets(bullets).pop();
            if (lastBullet) {
              const lastElement = document.querySelector(
                `[data-id="${lastBullet.id}"] .bullet-content`
              ) as HTMLElement;
              if (lastElement) {
                lastElement.focus();
              }
            }
          }
        }}
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm">Add new bullet</span>
      </button>
    </>
  );
};

export default BulletsView;