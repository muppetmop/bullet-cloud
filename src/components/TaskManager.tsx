import React, { useEffect } from "react";
import BulletItem from "./BulletItem";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { initializeQueue } from "@/utils/queueManager";
import BreadcrumbNav from "./navigation/BreadcrumbNav";
import { useBulletPath } from "@/hooks/useBulletPath";
import { useBulletState } from "@/hooks/useBulletState";
import { useBulletManager } from "@/hooks/useBulletManager";
import { useBulletNavigation } from "@/hooks/useBulletNavigation";
import { useQueuedSync } from "@/hooks/useQueuedSync";
import BulletTitle from "./bullet/BulletTitle";
import NewBulletButton from "./bullet/NewBulletButton";
import { supabase } from "@/integrations/supabase/client";

const TaskManager = () => {
  const queueHook = useQueuedSync();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  
  const { bullets, setBullets } = useBulletState(userId);
  const { currentBulletId, breadcrumbPath, setBreadcrumbPath, findBulletPath, handleZoom } = useBulletPath(bullets);
  const {
    getAllVisibleBullets,
    createNewBullet,
    createNewRootBullet,
    createNewZoomedBullet,
    updateBullet,
    deleteBullet,
    toggleCollapse,
    indentBullet,
    outdentBullet,
  } = useBulletManager();
  
  const { handleNavigate } = useBulletNavigation(getAllVisibleBullets, bullets);

  useEffect(() => {
    initializeQueue(queueHook);
  }, [queueHook]);

  const handleClearLocalStorage = () => {
    localStorage.clear();
    window.location.reload();
    toast.success("Local storage cleared. Reloading data from server.");
  };

  const handleTitleKeyDown = (event: React.KeyboardEvent<HTMLHeadingElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (currentBulletId) {
        const path = findBulletPath(currentBulletId, bullets);
        const parentBullet = path[path.length - 1];
        const newLevel = parentBullet.level + 1;
        
        const newBulletId = createNewZoomedBullet(currentBulletId, newLevel);
        
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

  const handleNewBullet = () => {
    console.log('Creating new bullet. Current state:', {
      currentBulletId,
      isEmptyZoomed: isEmptyZoomedState()
    });

    if (currentBulletId) {
      const path = findBulletPath(currentBulletId, bullets);
      const parentBullet = path[path.length - 1];
      const newLevel = parentBullet.level + 1;
      
      const newBulletId = createNewZoomedBullet(currentBulletId, newLevel);
      
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

  const handleNewBulletKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
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
  };

  const isEmptyZoomedState = () => {
    if (!currentBulletId) return false;
    const path = findBulletPath(currentBulletId, bullets);
    if (path.length > 0) {
      const currentBullet = path[path.length - 1];
      return currentBullet.children.length === 0;
    }
    return false;
  };

  return (
    <div className="max-w-3xl mx-auto p-8 relative min-h-screen">
      <BreadcrumbNav 
        path={breadcrumbPath} 
        onNavigate={handleZoom}
      />

      <BulletTitle
        currentBulletId={currentBulletId}
        breadcrumbPath={breadcrumbPath}
        onTitleChange={handleTitleChange}
        onTitleKeyDown={handleTitleKeyDown}
      />

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

      <NewBulletButton
        onNewBullet={handleNewBullet}
        onKeyDown={handleNewBulletKeyDown}
      />

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