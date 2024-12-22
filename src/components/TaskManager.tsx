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
    console.log('Zooming to bullet:', id);
    
    if (id === currentBulletId) {
      console.log('Already zoomed to this bullet, no change needed');
      return;
    }
    
    setCurrentBulletId(id);
    
    if (id) {
      const path = findBulletPath(id, bullets);
      console.log('Found bullet path:', path.map(b => ({
        id: b.id,
        content: b.content,
        level: b.level
      })));
      setBreadcrumbPath(path.map(b => ({ id: b.id, content: b.content })));
    } else {
      console.log('Returning to root level');
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
    console.log('Getting visible bullets for current bullet:', {
      currentBulletId,
      pathLength: path.length,
      lastBulletInPath: path.length > 0 ? {
        id: path[path.length - 1].id,
        content: path[path.length - 1].content,
        level: path[path.length - 1].level
      } : null
    });
    
    if (path.length > 0) {
      const currentBullet = path[path.length - 1];
      return currentBullet.children;
    }
    return [];
  };

  const isEmptyZoomedState = () => {
    if (!currentBulletId) return false;
    const path = findBulletPath(currentBulletId, bullets);
    if (path.length > 0) {
      const currentBullet = path[path.length - 1];
      console.log('Checking empty zoomed state:', {
        bulletId: currentBullet.id,
        content: currentBullet.content,
        level: currentBullet.level,
        childrenCount: currentBullet.children.length,
        isEmpty: currentBullet.children.length === 0
      });
      return currentBullet.children.length === 0;
    }
    return false;
  };

  const handleNewBullet = () => {
    console.log('Creating new bullet. Current state:', {
      currentBulletId,
      isEmptyZoomed: isEmptyZoomedState()
    });

    if (currentBulletId) {
      if (isEmptyZoomedState()) {
        const path = findBulletPath(currentBulletId, bullets);
        if (path.length > 0) {
          const currentBullet = path[path.length - 1];
          console.log('Creating indented bullet for empty zoomed state:', {
            parentId: currentBullet.id,
            parentLevel: currentBullet.level,
            newLevel: currentBullet.level + 1
          });
          
          const newBulletId = createNewBullet(currentBulletId, currentBullet.level + 1);
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
      } else {
        console.log('Creating bullet at same level, parent:', currentBulletId);
        const newBulletId = createNewBullet(currentBulletId);
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
    } else {
      console.log('Creating root bullet');
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