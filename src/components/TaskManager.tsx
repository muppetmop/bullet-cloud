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
import ModeToggle from "./mode/ModeToggle";
import { useUsersAndBullets } from "@/hooks/useUsersAndBullets";
import UsersList from "./users/UsersList";

const TaskManager = () => {
  const queueHook = useQueuedSync();
  const [currentBulletId, setCurrentBulletId] = useState<string | null>(null);
  const [breadcrumbPath, setBreadcrumbPath] = useState<{ id: string; content: string }[]>([]);
  const [mode, setMode] = useState<"yours" | "theirs">("yours");
  const { users, loading, error } = useUsersAndBullets();
  
  useEffect(() => {
    initializeQueue(queueHook);
  }, [queueHook]);

  const {
    bullets,
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
      let path;
      if (mode === "yours") {
        path = findBulletPath(id, bullets);
      } else {
        // Find the bullet in users' bullets
        for (const user of users) {
          if (user.id === id) {
            path = [{
              id: user.id,
              content: `📖 ${user.nom_de_plume}`,
              children: user.bullets,
              isCollapsed: false,
              position: 0,
              level: 0
            }];
            break;
          }
          
          path = findBulletPath(id, user.bullets);
          if (path.length > 0) {
            path = [{
              id: user.id,
              content: `📖 ${user.nom_de_plume}`,
              children: user.bullets,
              isCollapsed: false,
              position: 0,
              level: 0
            }, ...path];
            break;
          }
        }
      }
      
      if (path) {
        console.log('Found bullet path:', path.map(b => ({
          id: b.id,
          content: b.content,
          level: b.level
        })));
        
        setBreadcrumbPath(path.map(b => ({ id: b.id, content: b.content })));
      }
    } else {
      console.log('Returning to root level');
      setBreadcrumbPath([]);
    }
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
    if (mode === "theirs") {
      if (!currentBulletId) {
        return users.map(user => ({
          id: user.id,
          content: `📖 ${user.nom_de_plume}`,
          children: user.bullets.map(bullet => ({
            ...bullet,
            isCollapsed: bullet.isCollapsed || false,
            position: bullet.position || 0,
            level: bullet.level || 1,
            children: bullet.children || []
          })),
          isCollapsed: false,
          position: 0,
          level: 0
        }));
      }
      
      // Find the current user's bullets
      for (const user of users) {
        if (user.id === currentBulletId) {
          return user.bullets.map(bullet => ({
            ...bullet,
            isCollapsed: bullet.isCollapsed || false,
            position: bullet.position || 0,
            level: bullet.level || 0,
            children: bullet.children || []
          }));
        }
        
        const path = findBulletPath(currentBulletId, user.bullets);
        if (path.length > 0) {
          const currentBullet = path[path.length - 1];
          return currentBullet.children.map(bullet => ({
            ...bullet,
            isCollapsed: bullet.isCollapsed || false,
            position: bullet.position || 0,
            level: bullet.level || currentBullet.level + 1,
            children: bullet.children || []
          }));
        }
      }
      return [];
    }
    
    if (!currentBulletId) return bullets;
    
    const path = findBulletPath(currentBulletId, bullets);
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
      
      console.log('Path for new bullet:', {
        pathLength: path.length,
        currentBulletId,
        newLevel,
        parentLevel: parentBullet.level,
        pathDetails: path.map(b => ({
          id: b.id,
          content: b.content,
          level: b.level
        }))
      });

      const newBulletId = createNewZoomedBullet(currentBulletId, newLevel);
      console.log('Created new bullet:', {
        newBulletId,
        parentId: currentBulletId,
        level: newLevel
      });

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

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">Error: {error}</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-8 relative min-h-screen">
      <ModeToggle mode={mode} onModeChange={setMode} />
      
      <BreadcrumbNav 
        path={breadcrumbPath} 
        onNavigate={handleZoom}
      />

      {currentBulletId && mode === "yours" && (
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

      {mode === "yours" ? (
        <>
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
        </>
      ) : (
        <UsersList
          users={users}
          onUpdate={updateBullet}
          onDelete={deleteBullet}
          onNewBullet={createNewBullet}
          onCollapse={toggleCollapse}
          onNavigate={handleNavigate}
          onIndent={indentBullet}
          onOutdent={outdentBullet}
          onZoom={handleZoom}
        />
      )}

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
