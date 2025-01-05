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
import { findBulletAndParent, findBulletPath } from "@/utils/bulletOperations";
import BulletStateManager from "./managers/BulletStateManager";
import CollapsedStateManager from "./managers/CollapsedStateManager";

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
  const [yoursCollapsedState, setYoursCollapsedState] = useState<CollapsedState>({});
  const [theirsCollapsedState, setTheirsCollapsedState] = useState<CollapsedState>({});

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
    transferChildren,
  } = useBulletManager();

  const { handleNavigate } = useBulletNavigation(getAllVisibleBullets, bullets);

  const handleClearLocalStorage = () => {
    localStorage.clear();
    window.location.reload();
    toast.success("Local storage cleared. Reloading data from server.");
  };

  const handleCollapse = async (id: string) => {
    if (mode === "yours") {
      toggleCollapse(id);
      setYoursCollapsedState(prev => ({
        ...prev,
        [id]: !prev[id]
      }));
    } else {
      const user = findUserForBullet(id);
      if (user) {
        const isCollapsed = theirsCollapsedState[id] || false;
        setTheirsCollapsedState(prev => ({
          ...prev,
          [id]: !isCollapsed
        }));
        updateTheirsBullet(user.id, id, { isCollapsed: !isCollapsed });
      }
    }
  };

  const handleZoom = async (id: string) => {
    if (mode === "yours") {
      setCurrentBulletId(id);
      if (id) {
        const path = findBulletPath(id, bullets);
        if (path) {
          setBreadcrumbPath(path.map(b => ({ id: b.id, content: b.content })));
        }
      } else {
        setBreadcrumbPath([]);
      }
    } else {
      setTheirsCurrentBulletId(id);
      if (id) {
        for (const user of users) {
          const userBullets = theirsBullets[user.id] || [];
          const userBullet = transformUserToRootBullet({
            ...user,
            bullets: userBullets
          });
          
          if (userBullet.id === id) {
            setTheirsBreadcrumbPath([{ id: userBullet.id, content: userBullet.content }]);
            break;
          }
          
          const path = findBulletPath(id, userBullet.children);
          if (path.length > 0) {
            const fullPath = [userBullet, ...path];
            setTheirsBreadcrumbPath(fullPath.map(b => ({ id: b.id, content: b.content })));
            break;
          }
        }
      } else {
        setTheirsBreadcrumbPath([]);
      }
    }
  };

  const handleNewBullet = async (id: string): Promise<string> => {
    try {
      if (currentBulletId) {
        const path = findBulletPath(currentBulletId, bullets);
        const parentBullet = path[path.length - 1];
        const newLevel = parentBullet.level + 1;
        const newBulletId = await createNewZoomedBullet(currentBulletId, newLevel);
        
        if (newBulletId) {
          requestAnimationFrame(() => {
            const newElement = document.querySelector(
              `[data-id="${newBulletId}"] .bullet-content`
            ) as HTMLElement;
            if (newElement) {
              newElement.focus();
            }
          });
          return newBulletId;
        }
      } else {
        const newBulletId = await createNewRootBullet();
        if (newBulletId) {
          requestAnimationFrame(() => {
            const newElement = document.querySelector(
              `[data-id="${newBulletId}"] .bullet-content`
            ) as HTMLElement;
            if (newElement) {
              newElement.focus();
            }
          });
          return newBulletId;
        }
      }
      throw new Error('Failed to create new bullet');
    } catch (error) {
      console.error('Error creating new bullet:', error);
      toast.error('Failed to create new bullet');
      throw error;
    }
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

  const zoomedBulletContent = getCurrentZoomedBulletContent();

  return (
    <DragProvider>
      <div className="max-w-3xl mx-auto p-8 relative min-h-screen">
        <div className="absolute right-8 top-0">
          <ModeToggle mode={mode} onModeChange={setMode} />
        </div>
        
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

        <CollapsedStateManager
          mode={mode}
          onStateChange={mode === "yours" ? setYoursCollapsedState : setTheirsCollapsedState}
        />

        {mode === "yours" ? (
          <BulletStateManager
            currentBulletId={currentBulletId}
            mode={mode}
            bullets={bullets}
            onBulletUpdate={updateBullet}
            onBulletDelete={deleteBullet}
            onNewBullet={handleNewBullet}
            onCollapse={handleCollapse}
            onNavigate={handleNavigate}
            onIndent={indentBullet}
            onOutdent={outdentBullet}
            onZoom={handleZoom}
            onTransferChildren={transferChildren}
          />
        ) : (
          theirsCurrentBulletId ? (
            <BulletStateManager
              currentBulletId={theirsCurrentBulletId}
              mode={mode}
              bullets={users.map(user => transformUserToRootBullet({
                ...user,
                bullets: theirsBullets[user.id] || []
              }))}
              onBulletUpdate={updateBullet}
              onBulletDelete={deleteBullet}
              onNewBullet={handleNewBullet}
              onCollapse={handleCollapse}
              onNavigate={handleNavigate}
              onIndent={indentBullet}
              onOutdent={outdentBullet}
              onZoom={handleZoom}
              onTransferChildren={transferChildren}
            />
          ) : (
            <UsersListView
              users={users}
              onUpdate={updateBullet}
              onDelete={deleteBullet}
              onNewBullet={handleNewBullet}
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