import { BulletPoint } from "@/types/bullet";
import BulletItem from "../BulletItem";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { transformUserToRootBullet } from "@/utils/bulletTransformations";

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
}: UsersListProps) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  console.log('UsersList render:', {
    totalUsers: users.length,
    currentUserId,
    userDetails: users.map(user => ({
      id: user.id,
      nomDePlume: user.nom_de_plume,
      bulletCount: user.bullets.length
    }))
  });

  // Filter out current user and convert remaining users to bullet points format
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
    .map(user => transformUserToRootBullet(user));

  return (
    <div>
      {userBullets.map((bullet) => (
        <BulletItem
          key={bullet.id}
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
      ))}
    </div>
  );
};

export default UsersList;