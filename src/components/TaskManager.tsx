import React, { useEffect, useState } from "react";
import BulletItem from "./BulletItem";
import { Plus } from "lucide-react";
import { useBulletManager } from "@/hooks/useBulletManager";
import { useBulletNavigation } from "@/hooks/useBulletNavigation";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useQueuedSync } from "@/hooks/useQueuedSync";
import { initializeQueue } from "@/utils/queueManager";
import BreadcrumbNav from "./navigation/BreadcrumbNav";
import { BulletPoint } from "@/types/bullet";

const TaskManager = () => {
  const queueHook = useQueuedSync();
  const [currentBulletId, setCurrentBulletId] = useState<string | null>(null);
  const [breadcrumbPath, setBreadcrumbPath] = useState<{ id: string; content: string }[]>([]);
  
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
    createSameLevelBullet,
  } = useBulletManager();

  const { handleNavigate } = useBulletNavigation(getAllVisibleBullets, bullets);

  const handleClearLocalStorage = () => {
    localStorage.clear();
    window.location.reload();
    toast.success("Local storage cleared. Reloading data from server.");
  };

  const findBulletPath = (id: string | null, bullets: BulletPoint[]): BulletPoint[] => {
    if (!id) return [];
    
    for (const bullet of bullets) {
      if (bullet.id === id) {
        return [bullet];
      }
      const path = findBulletPath(id, bullet.children);
      if (path.length > 0) {
        return [bullet, ...path];
      }
    }
    return [];
  };

  const handleZoom = async (id: string | null) => {
    if (id === currentBulletId) return;
    
    setCurrentBulletId(id);
    
    if (id) {
      const path = findBulletPath(id, bullets);
      setBreadcrumbPath(path.map(b => ({ id: b.id, content: b.content })));
    } else {
      setBreadcrumbPath([]);
    }
  };

  const handleTitleChange = (event: React.FocusEvent<HTMLHeadingElement>) => {
    const newContent = event.target.textContent || "";
    if (currentBulletId) {
      updateBullet(currentBulletId, newContent);
      setBreadcrumbPath(prev => {
        const newPath = [...prev];
        newPath[newPath.length - 1].content = newContent;
        return newPath;
      });
    }
  };

  const getVisibleBullets = () => {
    if (!currentBulletId) return bullets;
    
    const path = findBulletPath(currentBulletId, bullets);
    if (path.length > 0) {
      const currentBullet = path[path.length - 1];
      return currentBullet.children;
    }
    return [];
  };

  const isEmptyZoomedState = () => {
    const visibleBullets = getVisibleBullets();
    return currentBulletId !== null && visibleBullets.length === 0;
  };

  const handleNewBullet = () => {
    if (currentBulletId) {
      let newBulletId;
      
      if (isEmptyZoomedState()) {
        // In empty zoomed state, create a bullet as a child of the current bullet
        newBulletId = createNewBullet(currentBulletId);
      } else {
        // Normal zoomed state behavior - create at same level
        newBulletId = createSameLevelBullet(currentBulletId);
      }

      if (newBulletId) {
        requestAnimationFrame(() => {
          const newElement = document.querySelector(
            `[data-id="${newBulletId}"] .bullet-content`
          ) as HTMLElement;
          if (newElement) {
            newElement.focus();
          }
        });
      }
    } else {
      const newBulletId = createNewRootBullet();
      if (newBulletId) {
        requestAnimationFrame(() => {
          const newElement = document.querySelector(
            `[data-id="${newBulletId}"] .bullet-content`
          ) as HTMLElement;
          if (newElement) {
            newElement.focus();
          }
        });
      }
    }
  };

  const handleTitleKeyDown = (event: React.KeyboardEvent<HTMLHeadingElement>) => {
    if (event.key === 'Enter' && currentBulletId) {
      event.preventDefault();
      // Always create at same level when pressing Enter in title
      const newBulletId = createSameLevelBullet(currentBulletId);
      if (newBulletId) {
        requestAnimationFrame(() => {
          const newElement = document.querySelector(
            `[data-id="${newBulletId}"] .bullet-content`
          ) as HTMLElement;
          if (newElement) {
            newElement.focus();
          }
        });
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 relative min-h-screen">
      <BreadcrumbNav 
        path={breadcrumbPath} 
        onNavigate={handleZoom}
      />

      {currentBulletId && (
        <h1 
          className="text-2xl font-semibold mb-6 outline-none"
          contentEditable
          suppressContentEditableWarning
          onBlur={handleTitleChange}
          onKeyDown={handleTitleKeyDown}
        >
          {breadcrumbPath[breadcrumbPath.length - 1]?.content || "Untitled"}
        </h1>
      )}

      {getVisibleBullets().map((bullet) => (
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
          onZoom={handleZoom}
        />
      ))}

      <button
        onClick={handleNewBullet}
        className="new-bullet-button w-full flex items-center gap-2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleNewBullet();
          } else if (e.key === "ArrowUp" && bullets.length > 0) {
            const lastBullet = getAllVisibleBullets(getVisibleBullets()).pop();
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

      <div className="fixed bottom-8 right-8">
        <Button 
          variant="outline" 
          onClick={handleClearLocalStorage}
          className="text-sm"
        >
          Reset Local Data
        </Button>
      </div>
    </div>
  );
};

export default TaskManager;