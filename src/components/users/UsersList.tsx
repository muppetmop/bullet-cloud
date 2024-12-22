import { BulletPoint } from "@/types/bullet";
import BulletItem from "../BulletItem";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  // Helper function to ensure all bullets have required properties
  const formatBullet = (bullet: BulletPoint, level: number): BulletPoint => ({
    ...bullet,
    children: bullet.children.map(child => formatBullet(child, level + 1)),
    isCollapsed: bullet.isCollapsed || false,
    position: bullet.position || 0,
    level: level,
  });

  // Filter out current user and convert remaining users to bullet points format
  const userBullets: BulletPoint[] = users
    .filter(user => user.id !== currentUserId)
    .map((user) => ({
      id: user.id,
      content: `📖 ${user.nom_de_plume}`,
      children: user.bullets.map(bullet => formatBullet(bullet, 1)),
      isCollapsed: false,
      position: 0,
      level: 0,
    }));

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