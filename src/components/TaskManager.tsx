import React, { useEffect, useState } from "react";
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
import BulletList from "./bullet/BulletList";
import { transformUserToRootBullet } from "@/utils/bulletTransformations";
import { useTheirsBulletState } from "@/hooks/useTheirsBulletState";
import ZoomedBulletTitle from "./bullet/ZoomedBulletTitle";

const TaskManager = () => {
  const queueHook = useQueuedSync();
  const [currentBulletId, setCurrentBulletId] = useState<string | null>(null);
  const [theirsCurrentBulletId, setTheirsCurrentBulletId] = useState<string | null>(null);
  const [breadcrumbPath, setBreadcrumbPath] = useState<{ id: string; content: string }[]>([]);
  const [theirsBreadcrumbPath, setTheirsBreadcrumbPath] = useState<{ id: string; content: string }[]>([]);
  const [mode, setMode] = useState<"yours" | "theirs">("yours");
  const { users, loading, error } = useUsersAndBullets();
  const { theirsBullets, updateTheirsBullet, setUserBullets } = useTheirsBulletState();
  
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
    console.log('Finding bullet path:', {
      searchId: id,
      bulletsCount: bullets.length,
      bulletLevels: bullets.map(b => ({
        id: b.id,
        content: b.content,
        level: b.level
      }))
    });

    if (!id) return [];
    
    for (const bullet of bullets) {
      if (bullet.id === id) {
        console.log('Found direct match:', {
          id: bullet.id,
          content: bullet.content,
          level: bullet.level
        });
        return [bullet];
      }
      const path = findBulletPath(id, bullet.children);
      if (path.length > 0) {
        console.log('Found in children:', {
          parentId: bullet.id,
          parentContent: bullet.content,
          parentLevel: bullet.level,
          childPath: path.map(b => ({
            id: b.id,
            content: b.content,
            level: b.level
          }))
        });
        return [bullet, ...path];
      }
    }
    return [];
  };

  const findUserForBullet = (bulletId: string) => {
    for (const user of users) {
      const userBullet = transformUserToRootBullet({
        ...user,
        bullets: theirsBullets[user.id] || []
      });
      
      if (userBullet.id === bulletId) {
        return user;
      }
      
      const path = findBulletPath(bulletId, userBullet.children);
      if (path.length > 0) {
        return user;
      }
    }
    return null;
  };

  const handleCollapse = (id: string) => {
    console.log('Handling collapse:', {
      mode,
      bulletId: id,
      currentBulletId: mode === "yours" ? currentBulletId : theirsCurrentBulletId
    });

    if (mode === "yours") {
      toggleCollapse(id);
    } else {
      const user = findUserForBullet(id);
      if (user) {
        const userBullet = transformUserToRootBullet({
          ...user,
          bullets: theirsBullets[user.id] || []
        });
        
        let isCollapsed = false;
        if (userBullet.id === id) {
          isCollapsed = userBullet.isCollapsed;
        } else {
          const path = findBulletPath(id, userBullet.children);
          if (path.length > 0) {
            isCollapsed = path[path.length - 1].isCollapsed;
          }
        }
        
        console.log('Updating theirs bullet collapse:', {
          userId: user.id,
          bulletId: id,
          currentCollapsed: isCollapsed,
          newCollapsed: !isCollapsed
        });
        
        updateTheirsBullet(user.id, id, { isCollapsed: !isCollapsed });
      }
    }
  };

  const handleZoom = async (id: string | null) => {
    console.log('Zooming to bullet:', {
      targetId: id,
      currentId: mode === "yours" ? currentBulletId : theirsCurrentBulletId,
      mode
    });
    
    if (mode === "yours") {
      if (id === currentBulletId) {
        console.log('Already zoomed to this bullet in yours mode, no change needed');
        return;
      }
      setCurrentBulletId(id);
      
      if (id) {
        const path = findBulletPath(id, bullets);
        if (path) {
          console.log('Setting yours breadcrumb path:', path.map(b => ({
            id: b.id,
            content: b.content,
            level: b.level
          })));
          setBreadcrumbPath(path.map(b => ({ id: b.id, content: b.content })));
        }
      } else {
        console.log('Returning to root level in yours mode');
        setBreadcrumbPath([]);
      }
    } else {
      if (id === theirsCurrentBulletId) {
        console.log('Already zoomed to this bullet in theirs mode, no change needed');
        return;
      }
      setTheirsCurrentBulletId(id);
      
      if (id) {
        console.log('Finding bullet in users bullets:', {
          targetId: id,
          userCount: users.length
        });
        
        for (const user of users) {
          const userBullets = theirsBullets[user.id] || [];
          const userBullet = transformUserToRootBullet({
            ...user,
            bullets: userBullets
          });
          
          if (userBullet.id === id) {
            console.log('Found matching user:', {
              userId: user.id,
              nomDePlume: user.nom_de_plume
            });
            setTheirsBreadcrumbPath([{ id: userBullet.id, content: userBullet.content }]);
            break;
          }
          
          const path = findBulletPath(id, userBullet.children);
          if (path.length > 0) {
            const fullPath = [userBullet, ...path];
            console.log('Found bullet in user children:', {
              userId: user.id,
              nomDePlume: user.nom_de_plume,
              pathLength: fullPath.length,
              path: fullPath.map(b => ({
                id: b.id,
                content: b.content,
                level: b.level
              }))
            });
            setTheirsBreadcrumbPath(fullPath.map(b => ({ id: b.id, content: b.content })));
            break;
          }
        }
      } else {
        console.log('Returning to root level in theirs mode');
        setTheirsBreadcrumbPath([]);
      }
    }
  };

  const getVisibleBullets = () => {
    if (mode === "theirs") {
      if (!theirsCurrentBulletId) {
        console.log('Getting root level bullets for theirs mode');
        return users.map(user => transformUserToRootBullet({
          ...user,
          bullets: theirsBullets[user.id] || []
        }));
      }
      
      console.log('Getting zoomed bullets for theirs mode:', {
        currentId: theirsCurrentBulletId,
        userCount: users.length
      });
      
      for (const user of users) {
        const userBullets = theirsBullets[user.id] || [];
        const userBullet = transformUserToRootBullet({
          ...user,
          bullets: userBullets
        });
        
        // First check if we're zoomed into a user root bullet
        if (userBullet.id === theirsCurrentBulletId) {
          console.log('Found matching user root bullet:', {
            userId: user.id,
            bulletId: userBullet.id,
            childrenCount: userBullet.children.length
          });
          return userBullet.children;
        }
        
        // Then check nested bullets
        const path = findBulletPath(theirsCurrentBulletId, userBullet.children);
        if (path.length > 0) {
          const targetBullet = path[path.length - 1];
          console.log('Found nested bullet for zoom:', {
            userId: user.id,
            bulletId: targetBullet.id,
            childrenCount: targetBullet.children.length,
            path: path.map(b => ({
              id: b.id,
              content: b.content,
              childrenCount: b.children.length
            }))
          });
          return targetBullet.children;
        }
      }
      
      console.log('No matching bullet found for zoom in theirs mode');
      return [];
    }
    
    // Yours mode logic remains unchanged
    if (!currentBulletId) return bullets;
    
    const path = findBulletPath(currentBulletId, bullets);
    if (path.length > 0) {
      const currentBullet = path[path.length - 1];
      return currentBullet.children;
    }
    return [];
  };

  const getCurrentZoomedBulletContent = () => {
    if (mode === "theirs" && theirsCurrentBulletId) {
      const theirsBreadcrumb = theirsBreadcrumbPath[theirsBreadcrumbPath.length - 1];
      return theirsBreadcrumb?.content;
    }
    if (mode === "yours" && currentBulletId) {
      const yoursBreadcrumb = breadcrumbPath[breadcrumbPath.length - 1];
      return yoursBreadcrumb?.content;
    }
    return null;
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

  const zoomedBulletContent = getCurrentZoomedBulletContent();

  return (
    <div className="max-w-3xl mx-auto p-8 relative min-h-screen">
      <ModeToggle mode={mode} onModeChange={setMode} />
      
      <BreadcrumbNav 
        path={mode === "yours" ? breadcrumbPath : theirsBreadcrumbPath}
        onNavigate={handleZoom}
        mode={mode}
      />

      {zoomedBulletContent && (
        <ZoomedBulletTitle 
          content={zoomedBulletContent}
          mode={mode}
        />
      )}

      {mode === "yours" ? (
        <>
          <BulletList
            bullets={getVisibleBullets()}
            onUpdate={updateBullet}
            onDelete={deleteBullet}
            onNewBullet={createNewBullet}
            onCollapse={handleCollapse}
            onNavigate={handleNavigate}
            onIndent={indentBullet}
            onOutdent={outdentBullet}
            onZoom={handleZoom}
          />

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
          onCollapse={handleCollapse}
          onNavigate={handleNavigate}
          onIndent={indentBullet}
          onOutdent={outdentBullet}
          onZoom={handleZoom}
          theirsBullets={theirsBullets}
          onSetUserBullets={setUserBullets}
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