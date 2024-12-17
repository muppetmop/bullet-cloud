import React, { useEffect, useState } from "react";
import BulletItem from "./BulletItem";
import { Plus } from "lucide-react";
import { useBulletManager } from "@/hooks/useBulletManager";
import { useBulletNavigation } from "@/hooks/useBulletNavigation";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useQueuedSync } from "@/hooks/useQueuedSync";
import { initializeQueue } from "@/utils/queueManager";
import Breadcrumb from "./navigation/Breadcrumb";
import { BulletPoint } from "@/types/bullet";

const TaskManager = () => {
  const queueHook = useQueuedSync();
  const [focusedBulletId, setFocusedBulletId] = useState<string | null>(null);
  const [breadcrumbPath, setBreadcrumbPath] = useState<BulletPoint[]>([]);
  
  useEffect(() => {
    initializeQueue(queueHook);
  }, [queueHook]);

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
    findBulletAndParent,
  } = useBulletManager();

  const { handleNavigate } = useBulletNavigation(getAllVisibleBullets, bullets);

  const handleClearLocalStorage = () => {
    localStorage.clear();
    window.location.reload();
    toast.success("Local storage cleared. Reloading data from server.");
  };

  const getBulletPath = (bulletId: string): BulletPoint[] => {
    const path: BulletPoint[] = [];
    let currentBullet = bulletId ? findBulletAndParent(bulletId, bullets)[0] : null;
    
    while (currentBullet) {
      path.unshift(currentBullet);
      const parentBullet = currentBullet.parent_id 
        ? findBulletAndParent(currentBullet.parent_id, bullets)[0]
        : null;
      currentBullet = parentBullet;
    }
    
    return path;
  };

  const handleBulletFocus = (bulletId: string) => {
    setFocusedBulletId(bulletId);
    setBreadcrumbPath(getBulletPath(bulletId));
  };

  const handleBreadcrumbNavigate = (bulletId: string | null) => {
    setFocusedBulletId(bulletId);
    setBreadcrumbPath(bulletId ? getBulletPath(bulletId) : []);
  };

  const visibleBullets = focusedBulletId
    ? findBulletAndParent(focusedBulletId, bullets)[0]?.children || []
    : bullets;

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="mb-6 space-y-4">
        <Button 
          variant="ghost" 
          onClick={handleClearLocalStorage}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Reset Local Data
        </Button>
        <Breadcrumb 
          path={breadcrumbPath} 
          onNavigate={handleBreadcrumbNavigate} 
        />
      </div>
      <div className="space-y-0.5">
        {visibleBullets.map((bullet) => (
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
            onFocus={handleBulletFocus}
          />
        ))}
      </div>
      <button
        onClick={focusedBulletId ? () => createNewBullet(focusedBulletId) : createNewRootBullet}
        className="w-full flex items-center gap-2 p-2 text-gray-400 hover:text-gray-600 transition-colors mt-2"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            focusedBulletId ? createNewBullet(focusedBulletId) : createNewRootBullet();
          } else if (e.key === "ArrowUp" && visibleBullets.length > 0) {
            const lastBullet = getAllVisibleBullets(visibleBullets).pop();
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