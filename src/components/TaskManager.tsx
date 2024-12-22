import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import BulletItem from "./BulletItem";
import FloatingToggle from "./navigation/FloatingToggle";
import BreadcrumbNav from "./navigation/BreadcrumbNav";
import FloatingUserToggle from "./FloatingUserToggle";
import UsersList from "./UsersList";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getAllVisibleBullets } from "@/utils/bulletOperations";

const TaskManager = () => {
  const [isWriteMode, setIsWriteMode] = useState(true);
  const [isYourBullets, setIsYourBullets] = useState(true);
  const [currentBulletId, setCurrentBulletId] = useState<string | null>(null);
  const [breadcrumbPath, setBreadcrumbPath] = useState<BulletPoint[]>([]);
  const [bullets, setBullets] = useState<BulletPoint[]>([]);

  const { data: otherUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nom_de_plume');
      
      if (!profiles) return [];

      const usersWithBullets = await Promise.all(
        profiles.map(async (profile) => {
          const { data: bullets } = await supabase
            .from('bullets')
            .select('*')
            .eq('user_id', profile.id)
            .order('position');

          const bulletMap = new Map<string, BulletPoint>();
          const rootBullets: BulletPoint[] = [];
          
          bullets?.forEach(bullet => {
            bulletMap.set(bullet.id, {
              ...bullet,
              children: [],
              isCollapsed: bullet.is_collapsed
            });
          });
          
          bullets?.forEach(bullet => {
            const bulletPoint = bulletMap.get(bullet.id)!;
            if (bullet.parent_id) {
              const parent = bulletMap.get(bullet.parent_id);
              if (parent) {
                parent.children.push(bulletPoint);
              }
            } else {
              rootBullets.push(bulletPoint);
            }
          });

          return {
            ...profile,
            bullets: rootBullets
          };
        })
      );

      return usersWithBullets;
    },
    enabled: !isYourBullets
  });

  const handleUserZoom = (userId: string) => {
    console.log('Zooming to user:', userId);
  };

  const handleZoom = (bulletId: string) => {
    // Implementation for zooming into a bullet
  };

  const handleTitleChange = (event: React.FocusEvent<HTMLHeadingElement>) => {
    // Implementation for title change
  };

  const handleTitleKeyDown = (event: React.KeyboardEvent<HTMLHeadingElement>) => {
    // Implementation for title keydown
  };

  const getVisibleBullets = () => {
    return bullets;
  };

  const updateBullet = (id: string, content: string) => {
    // Implementation for updating bullet
  };

  const deleteBullet = (id: string) => {
    // Implementation for deleting bullet
  };

  const createNewBullet = (id: string) => {
    return null;
  };

  const toggleCollapse = (id: string) => {
    // Implementation for toggling collapse
  };

  const handleNavigate = (direction: "up" | "down", id: string) => {
    // Implementation for navigation
  };

  const indentBullet = (id: string) => {
    // Implementation for indenting bullet
  };

  const outdentBullet = (id: string) => {
    // Implementation for outdenting bullet
  };

  const handleNewBullet = () => {
    // Implementation for handling new bullet
  };

  const handleClearLocalStorage = () => {
    // Implementation for clearing local storage
  };

  return (
    <div className="max-w-3xl mx-auto p-8 relative min-h-screen">
      <BreadcrumbNav 
        path={breadcrumbPath} 
        onNavigate={handleZoom}
      />

      {isYourBullets ? (
        <>
          {currentBulletId && (
            <h1 
              className="text-2xl font-semibold mb-6 outline-none"
              contentEditable={isWriteMode}
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
              isWriteMode={isWriteMode}
            />
          ))}

          {isWriteMode && (
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
          )}
        </>
      ) : (
        <UsersList 
          users={otherUsers || []} 
          onUserZoom={handleUserZoom}
        />
      )}

      <FloatingToggle 
        isWriteMode={isWriteMode}
        onToggle={setIsWriteMode}
      />

      <FloatingUserToggle 
        isYourBullets={isYourBullets}
        onToggle={setIsYourBullets}
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
