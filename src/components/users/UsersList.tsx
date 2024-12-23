import { BulletPoint } from "@/types/bullet";
import BulletItem from "../BulletItem";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { transformUserToRootBullet } from "@/utils/bulletTransformations";
import { ChevronDown, ChevronUp } from "lucide-react";

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

  const toggleUserCollapse = (userId: string) => {
    setCollapsedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  console.log('UsersList render:', {
    totalUsers: users.length,
    currentUserId,
    userDetails: users.map(user => ({
      id: user.id,
      nomDePlume: user.nom_de_plume,
      bulletCount: user.bullets.length
    }))
  });

  const userBullets: BulletPoint[] = users
    .filter(user => {
      const filtered = user.id !== currentUserId;
      console.log('Filtering user:', {
        userId: user.id,
        nomDePlume: user.nom_de_plume,
        isCurrentUser: user.id === currentUserId,
        included: filtered
      });
      return filtered;
    })
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

  return (
    <div>
      {userBullets.map((bullet) => (
        <div key={bullet.id} className="relative">
          <button
            onClick={() => toggleUserCollapse(bullet.id)}
            className="absolute left-[-1.25rem] top-[0.45rem] w-4 h-4 inline-flex items-center justify-center rounded-sm hover:bg-accent transition-colors"
          >
            {bullet.isCollapsed ? (
              <ChevronUp className="w-4 h-4 text-gray-400 hover:text-[#9b87f5]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400 hover:text-[#9b87f5]" />
            )}
          </button>
          <BulletItem
            bullet={bullet}
            level={0}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onNewBullet={onNewBullet}
            onCollapse={onCollapse}
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