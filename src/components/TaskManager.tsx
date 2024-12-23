import React, { useEffect, useState } from "react";
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
import { transformUserToRootBullet } from "@/utils/bulletTransformations";
import { useTheirsBulletState } from "@/hooks/useTheirsBulletState";
import ZoomedBulletTitle from "./bullet/ZoomedBulletTitle";
import BulletsView from "./bullet/BulletsView";
import UsersListView from "./users/UsersListView";
import { DragProvider } from "@/contexts/DragContext";
import { findBulletAndParent } from "@/utils/bulletOperations";

interface CollapsedState {
  [key: string]: boolean;
}

const TaskManager = () => {
  const queueHook = useQueuedSync();
  const [currentBulletId, setCurrentBulletId] = useState<string | null>(null);
  const [theirsCurrentBulletId, setTheirsCurrentBulletId] = useState<string | null>(null);
  const [breadcrumbPath, setBreadcrumbPath] = useState<{ id: string; content: string }[]>([]);
  const [theirsBreadcrumbPath, setTheirsBreadcrumbPath] = useState<{ id: string; content: string }[]>([]);
  const [mode, setMode] = useState<"yours" | "theirs">("yours");
  const { users, loading, error } = useUsersAndBullets();
  const { theirsBullets, updateTheirsBullet, setUserBullets } = useTheirsBulletState();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragLevel, setDragLevel] = useState<number>(0);
  
  // Add state for collapsed states
  const [yoursCollapsedState, setYoursCollapsedState] = useState<CollapsedState>(() => {
    const saved = localStorage.getItem('yoursCollapsedState');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [theirsCollapsedState, setTheirsCollapsedState] = useState<CollapsedState>(() => {
    const saved = localStorage.getItem('theirsCollapsedState');
    // If no saved state, start with everything collapsed
    if (!saved) {
      const initialState: CollapsedState = {};
      users.forEach(user => {
        // Collapse the user root bullet
        const userBullet = transformUserToRootBullet({
          ...user,
          bullets: theirsBullets[user.id] || []
        });
        initialState[userBullet.id] = true;

        // Recursively collapse all children
        const addChildrenToState = (bullet: BulletPoint) => {
          bullet.children.forEach(child => {
            initialState[child.id] = true;
            if (child.children.length > 0) {
              addChildrenToState(child);
            }
          });
        };
        
        // Make sure to collapse all children of the user bullet
        if (userBullet.children.length > 0) {
          addChildrenToState(userBullet);
        }
      });
      return initialState;
    }
    return JSON.parse(saved);
  });

  // Save collapsed states to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('yoursCollapsedState', JSON.stringify(yoursCollapsedState));
  }, [yoursCollapsedState]);

  useEffect(() => {
    localStorage.setItem('theirsCollapsedState', JSON.stringify(theirsCollapsedState));
  }, [theirsCollapsedState]);

  // Save current zoom states
  useEffect(() => {
    localStorage.setItem('currentBulletId', currentBulletId || '');
  }, [currentBulletId]);

  useEffect(() => {
    localStorage.setItem('theirsCurrentBulletId', theirsCurrentBulletId || '');
  }, [theirsCurrentBulletId]);

  // Load zoom states on init
  useEffect(() => {
    const savedCurrentBulletId = localStorage.getItem('currentBulletId');
    if (savedCurrentBulletId) {
      setCurrentBulletId(savedCurrentBulletId === '' ? null : savedCurrentBulletId);
    }

    const savedTheirsCurrentBulletId = localStorage.getItem('theirsCurrentBulletId');
    if (savedTheirsCurrentBulletId) {
      setTheirsCurrentBulletId(savedTheirsCurrentBulletId === '' ? null : savedTheirsCurrentBulletId);
    }
  }, []);

  useEffect(() => {
    initializeQueue(queueHook);
  }, [queueHook]);

  const {
    bullets,
    setBullets,
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
      setYoursCollapsedState(prev => ({
        ...prev,
        [id]: !prev[id]
      }));
    } else {
      const user = findUserForBullet(id);
      if (user) {
        const userBullet = transformUserToRootBullet({
          ...user,
          bullets: theirsBullets[user.id] || []
        });
        
        let isCollapsed = theirsCollapsedState[id] || false;
        
        console.log('Updating theirs bullet collapse:', {
          userId: user.id,
          bulletId: id,
          currentCollapsed: isCollapsed,
          newCollapsed: !isCollapsed
        });
        
        setTheirsCollapsedState(prev => {
          const newState = {
            ...prev,
            [id]: !isCollapsed
          };
          
          // If we're expanding a bullet, make sure its immediate children stay collapsed
          if (isCollapsed) {
            const bullet = findBulletPath(id, [userBullet])[0];
            if (bullet && bullet.children) {
              bullet.children.forEach(child => {
                newState[child.id] = true;
              });
            }
          }
          
          return newState;
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

  const handleDrop = (draggedId: string, targetId: string, newLevel: number) => {
    console.log('Handling drop:', {
      draggedId,
      targetId,
      newLevel,
      currentBullets: bullets
    });

    // First update local state
    setBullets(prevBullets => {
      const [draggedBullet, draggedParent] = findBulletAndParent(draggedId, prevBullets);
      const [targetBullet, targetParent] = findBulletAndParent(targetId, prevBullets);
      
      if (!draggedBullet || !targetBullet) {
        console.error('Could not find bullets for drag operation:', {
          draggedId,
          targetId,
          draggedFound: !!draggedBullet,
          targetFound: !!targetBullet
        });
        return prevBullets;
      }

      // Remove bullet from its current position
      if (draggedParent) {
        const draggedIndex = draggedParent.indexOf(draggedBullet);
        draggedParent.splice(draggedIndex, 1);
      }

      // Add bullet to its new position
      if (targetParent) {
        const targetIndex = targetParent.indexOf(targetBullet);
        targetParent.splice(targetIndex + 1, 0, {
          ...draggedBullet,
          level: newLevel,
          parent_id: targetBullet.parent_id
        });
      }

      // Create a new array to trigger re-render
      const newBullets = [...prevBullets];
      
      // Save to localStorage
      localStorage.setItem('bullets', JSON.stringify(newBullets));
      
      console.log('Updated bullets after drop:', {
        newBullets,
        draggedId,
        targetId,
        newLevel
      });

      return newBullets;
    });

    // Queue update to server
    queueHook.addToQueue({
      id: draggedId,
      type: 'update',
      data: {
        parent_id: targetId,
        level: newLevel,
        position: targetId ? getVisibleBullets().findIndex(b => b.id === targetId) + 1 : 0
      }
    });

    toast.success('Bullet moved successfully');
  };

  const zoomedBulletContent = getCurrentZoomedBulletContent();
  const visibleBullets = getVisibleBullets();

  return (
    <DragProvider>
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
          <BulletsView
            bullets={visibleBullets}
            onUpdate={updateBullet}
            onDelete={deleteBullet}
            onNewBullet={createNewBullet}
            onCollapse={handleCollapse}
            onNavigate={handleNavigate}
            onIndent={indentBullet}
            onOutdent={outdentBullet}
            onZoom={handleZoom}
            handleNewBullet={handleNewBullet}
            getAllVisibleBullets={getAllVisibleBullets}
            mode="yours"
            loading={loading}
          />
        ) : (
          theirsCurrentBulletId ? (
            <BulletsView
              bullets={visibleBullets}
              onUpdate={updateBullet}
              onDelete={deleteBullet}
              onNewBullet={createNewBullet}
              onCollapse={handleCollapse}
              onNavigate={handleNavigate}
              onIndent={indentBullet}
              onOutdent={outdentBullet}
              onZoom={handleZoom}
              handleNewBullet={handleNewBullet}
              getAllVisibleBullets={getAllVisibleBullets}
              mode="theirs"
              loading={loading}
            />
          ) : (
            <UsersListView
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
              handleNewBullet={handleNewBullet}
            />
          )
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
    </DragProvider>
  );
};

export default TaskManager;
