import React from 'react';
import { Plus } from "lucide-react";
import BulletList from "./BulletList";
import { BulletPoint } from "@/types/bullet";
import { Skeleton } from "@/components/ui/skeleton";

interface BulletsViewProps {
  bullets: BulletPoint[];
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onNewBullet: (id: string) => Promise<string>;
  onCollapse: (id: string) => void;
  onNavigate: (direction: "up" | "down", id: string) => void;
  onIndent: (id: string) => void;
  onOutdent: (id: string) => void;
  onZoom: (id: string) => void;
  handleNewBullet: () => Promise<void>;
  getAllVisibleBullets: (bullets: BulletPoint[]) => BulletPoint[];
  mode?: "yours" | "theirs";
  loading?: boolean;
  onTransferChildren?: (fromBulletId: string, toBulletId: string) => void;
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
  getAllVisibleBullets,
  mode = "yours",
  loading = false,
  onTransferChildren
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="flex items-start gap-2">
            <div className="flex items-center gap-2 mt-1">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="h-6 flex-grow" />
          </div>
        ))}
      </div>
    );
  }

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
        mode={mode}
        onTransferChildren={onTransferChildren}
      />
      {mode === "yours" && (
        <button
          onClick={handleNewBullet}
          className="new-bullet-button w-full flex items-center gap-2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          tabIndex={0}
          onKeyDown={async (e) => {
            if (e.key === "Enter") {
              await handleNewBullet();
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
      )}
    </>
  );
};

export default BulletsView;