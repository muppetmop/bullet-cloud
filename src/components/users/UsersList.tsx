import { BulletPoint } from "@/types/bullet";
import BulletItem from "../BulletItem";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { transformUserToRootBullet } from "@/utils/bulletTransformations";
import { Skeleton } from "@/components/ui/skeleton";

interface UsersListProps {
  users: {
    id: string;
    nom_de_plume: string;
    bullets: BulletPoint[];
  }[];
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onNewBullet: (id: string) => string | null;
  onCollapse: (id: string) => void;
  onNavigate: (direction: "up" | "down", id: string) => void;
  onIndent: (id: string) => void;
  onOutdent: (id: string) => void;
  onZoom: (id: string) => void;
  theirsBullets: {[key: string]: BulletPoint[]};
  onSetUserBullets: (userId: string, bullets: BulletPoint[]) => void;
}

const UsersList = ({
  users,
  onUpdate,
  onDelete,
  onNewBullet,
  onCollapse,
  onNavigate,
  onIndent,
  onOutdent,
  onZoom,
  theirsBullets,
  onSetUserBullets
}: UsersListProps) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [collapsedUsers, setCollapsedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Filter users and transform them to bullets in one memoized operation
  const userBullets = useMemo(() => {
    if (!currentUserId) return [];
    
    return users
      .filter(user => user.id !== currentUserId)
      .map(user => {
        const bullet = transformUserToRootBullet({
          ...user,
          bullets: theirsBullets[user.id] || user.bullets
        });
        return {
          ...bullet,
          isCollapsed: collapsedUsers.has(user.id)
        };
      });
  }, [users, currentUserId, theirsBullets, collapsedUsers]);

  useEffect(() => {
    users.forEach(user => {
      if (!theirsBullets[user.id]) {
        console.log('Initializing bullets for user:', {
          userId: user.id,
          nomDePlume: user.nom_de_plume,
          bulletCount: user.bullets.length
        });
        onSetUserBullets(user.id, user.bullets);
      }
    });
  }, [users, theirsBullets, onSetUserBullets]);

  if (!currentUserId) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="pl-8 space-y-2">
              {[1, 2].map((subIndex) => (
                <div key={subIndex} className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3" />
                  <Skeleton className="h-5 w-36" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {userBullets.map((bullet) => (
        <div key={bullet.id}>
          <BulletItem
            bullet={bullet}
            level={0}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onNewBullet={onNewBullet}
            onCollapse={(id) => {
              const user = users.find(u => transformUserToRootBullet(u).id === id);
              if (user) {
                setCollapsedUsers(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(user.id)) {
                    newSet.delete(user.id);
                  } else {
                    newSet.add(user.id);
                  }
                  return newSet;
                });
              }
              onCollapse(id);
            }}
            onNavigate={onNavigate}
            onIndent={onIndent}
            onOutdent={onOutdent}
            onZoom={onZoom}
          />
        </div>
      ))}
    </div>
  );
};

export default UsersList;