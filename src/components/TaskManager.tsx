import React from "react";
import BulletItem from "./BulletItem";
import { Plus } from "lucide-react";
import { useBulletManager } from "@/hooks/useBulletManager";
import { useBulletNavigation } from "@/hooks/useBulletNavigation";

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1EAEDB]"></div>
      </div>
    );
  }

  const handleNewBullet = async (id: string) => {
    const newBulletId = await createNewBullet(id);
    return newBulletId;
  };

  const handleNewRootBullet = async () => {
    await createNewRootBullet();
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      {bullets.map((bullet) => (
        <BulletItem
          key={bullet.id}
          bullet={bullet}
          level={0}
          onUpdate={updateBullet}
          onDelete={deleteBullet}
          onNewBullet={handleNewBullet}
          onCollapse={toggleCollapse}
          onNavigate={handleNavigate}
          onIndent={indentBullet}
          onOutdent={outdentBullet}
        />
      ))}
      <button
        onClick={handleNewRootBullet}
        className="new-bullet-button w-full flex items-center gap-2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleNewRootBullet();
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
    </div>
  );
};

export default TaskManager;