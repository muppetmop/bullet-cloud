import React, { useEffect } from "react";
import BulletItem from "./BulletItem";
import { Plus } from "lucide-react";
import { useBulletManager } from "@/hooks/useBulletManager";
import { useBulletNavigation } from "@/hooks/useBulletNavigation";
import { Button } from "./ui/button";
import { toast } from "sonner";

const TaskManager = () => {
  const {
    bullets,
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

  const handleClearLocalStorage = () => {
    localStorage.clear();
    window.location.reload();
    toast.success("Local storage cleared. Reloading data from server.");
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="mb-4">
        <Button 
          variant="outline" 
          onClick={handleClearLocalStorage}
          className="text-sm"
        >
          Reset Local Data
        </Button>
      </div>
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