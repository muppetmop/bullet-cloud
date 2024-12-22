import { BulletPoint } from "@/types/bullet";
import BulletItem from "../BulletItem";

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
  // Convert users to bullet points format
  const userBullets: BulletPoint[] = users.map((user) => ({
    id: user.id,
    content: `📖 ${user.nom_de_plume}`,
    children: user.bullets,
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