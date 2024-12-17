import React, { useEffect, useState } from "react";
import BulletItem from "./BulletItem";
import { Plus } from "lucide-react";
import { useBulletManager } from "@/hooks/useBulletManager";
import { useBulletNavigation } from "@/hooks/useBulletNavigation";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useQueuedSync } from "@/hooks/useQueuedSync";
import { initializeQueue } from "@/utils/queueManager";
import BreadcrumbNav from "./BreadcrumbNav";
import { BulletPoint } from "@/types/bullet";

const TaskManager = () => {
  const queueHook = useQueuedSync();
  const [currentBulletId, setCurrentBulletId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BulletPoint[]>([]);
  
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

  const getBreadcrumbPath = (bulletId: string | null, bullets: BulletPoint[]): BulletPoint[] => {
    if (!bulletId) return [];
    
    const findPath = (id: string, currentBullets: BulletPoint[], path: BulletPoint[] = []): BulletPoint[] => {
      for (const bullet of currentBullets) {
        if (bullet.id === id) {
          return [...path, bullet];
        }
        const foundInChildren = findPath(id, bullet.children, [...path, bullet]);
        if (foundInChildren.length > 0) {
          return foundInChildren;
        }
      }
      return [];
    };
    
    return findPath(bulletId, bullets);
  };

  useEffect(() => {
    if (currentBulletId) {
      setBreadcrumbs(getBreadcrumbPath(currentBulletId, bullets));
    } else {
      setBreadcrumbs([]);
    }
  }, [currentBulletId, bullets]);

  const handleZoom = (bulletId: string | null) => {
    setCurrentBulletId(bulletId);
    if (bulletId) {
      const [bullet] = findBulletAndParent(bulletId, bullets);
      if (bullet && bullet.children.length === 0) {
        // Create a new bullet if there are no children
        createNewBullet(bulletId);
      }
    }
  };

  const getCurrentBullets = () => {
    if (!currentBulletId) return bullets;
    const [bullet] = findBulletAndParent(currentBulletId, bullets);
    return bullet ? bullet.children : [];
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="mb-4 flex justify-between items-center">
        <BreadcrumbNav 
          breadcrumbs={breadcrumbs} 
          onNavigate={handleZoom}
        />
        <Button 
          variant="outline" 
          onClick={handleClearLocalStorage}
          className="text-sm"
        >
          Reset Local Data
        </Button>
      </div>
      
      {currentBulletId && (
        <h1 className="text-2xl font-bold mb-6 text-[#1EAEDB]">
          {breadcrumbs[breadcrumbs.length - 1]?.content || "Untitled"}
        </h1>
      )}
      
      {getCurrentBullets().map((bullet) => (
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
        onClick={currentBulletId ? () => createNewBullet(currentBulletId) : createNewRootBullet}
        className="new-bullet-button w-full flex items-center gap-2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (currentBulletId) {
              createNewBullet(currentBulletId);
            } else {
              createNewRootBullet();
            }
          } else if (e.key === "ArrowUp" && getCurrentBullets().length > 0) {
            const lastBullet = getAllVisibleBullets(getCurrentBullets()).pop();
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