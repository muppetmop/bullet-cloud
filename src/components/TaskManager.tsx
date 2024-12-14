import React from "react";
import BulletItem from "./BulletItem";
import { Plus } from "lucide-react";
import { useBulletManager } from "@/hooks/useBulletManager";
import { useBulletNavigation } from "@/hooks/useBulletNavigation";
import { Skeleton } from "@/components/ui/skeleton";

const TaskManager = () => {
  const {
    bullets,
    isLoading,
    getAllVisibleBullets,
    createNewBullet,
    createNewRootBullet,
    updateBullet,
    deleteBullet,
    toggleCollapse,
    indentBullet,
    outdentBullet,
  } = useBulletManager();

  const { handleNavigate } = useBulletNavigation(getAllVisibleBullets, bullets);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-8 space-y-4">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-5/6" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      {bullets.map((bullet) => (
        <BulletItem
          key={bullet.id}
          bullet={bullet}
          level={0}
          onUpdate={updateBullet}
          onDelete={deleteBullet}
          onNewBullet={createNewBullet}
          onCollapse={toggleCollapse}
          onNavigate={handleNavigate}
          onIndent={indentBullet}
          onOutdent={outdentBullet}
        />
      ))}
      <button
        onClick={createNewRootBullet}
        className="new-bullet-button w-full flex items-center gap-2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            createNewRootBullet();
          } else if (e.key === "ArrowUp" && bullets.length > 0) {
            const lastBullet = getAllVisibleBullets(bullets).pop();
            if (lastBullet) {
              const element = document.querySelector(
                `[data-id="${lastBullet.id}"] .bullet-content`
              ) as HTMLElement;
              if (element) {
                element.focus();
              }
            }
          }
        }}
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm">Add new bullet</span>
      </button>
    </div>
  );
};

export default TaskManager;