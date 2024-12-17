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
    if (id === currentBulletId) return;
    
    setCurrentBulletId(id);
    
    if (id) {
      const path = findBulletPath(id, bullets);
      setBreadcrumbPath(path.map(b => ({ id: b.id, content: b.content })));
    } else {
      setBreadcrumbPath([]);
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

  const handleTitleChange = (e: React.FormEvent<HTMLHeadingElement>) => {
    if (!currentBulletId) return;
    const newContent = e.currentTarget.textContent || "";
    updateBullet(currentBulletId, newContent);
    
    // Update breadcrumb path with new content
    setBreadcrumbPath(prev => {
      const newPath = [...prev];
      newPath[newPath.length - 1] = {
        ...newPath[newPath.length - 1],
        content: newContent
      };
      return newPath;
    });
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
          onInput={handleTitleChange}
          suppressContentEditableWarning
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