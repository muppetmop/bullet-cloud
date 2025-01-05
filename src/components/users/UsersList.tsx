import React from "react";
import { User } from "@/types/user";
import { BulletPoint } from "@/types/bullet";
import BulletItem from "../BulletItem";
import { transformUserToRootBullet } from "@/utils/bulletTransformations";

interface UsersListProps {
  users: User[];
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onNewBullet: (id: string) => Promise<string | null>;
  onCollapse: (id: string) => void;
  onNavigate: (direction: "up" | "down", id: string) => void;
  onIndent: (id: string) => void;
  onOutdent: (id: string) => void;
  onZoom: (id: string) => void;
  theirsBullets: { [key: string]: BulletPoint[] };
  onSetUserBullets: (userId: string, bullets: BulletPoint[]) => void;
  handleNewBullet: (id: string) => Promise<string | null>;
}

const UsersList: React.FC<UsersListProps> = ({
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
  onSetUserBullets,
  handleNewBullet
}) => {
  const transformedUsers = users.map(user => {
    return transformUserToRootBullet({
      ...user,
      bullets: theirsBullets[user.id] || []
    });
  });

  return (
    <div className="space-y-4">
      {transformedUsers.map((userBullet) => (
        <div key={userBullet.id} className="space-y-2">
          <BulletItem
            bullet={userBullet}
            level={0}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onNewBullet={onNewBullet}
            onCollapse={onCollapse}
            onNavigate={onNavigate}
            onIndent={onIndent}
            onOutdent={onOutdent}
            onZoom={onZoom}
            mode="theirs"
          />
          {!userBullet.isCollapsed && userBullet.children.length > 0 && (
            <div className="ml-6">
              {userBullet.children.map((bullet) => (
                <BulletItem
                  key={bullet.id}
                  bullet={bullet}
                  level={1}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onNewBullet={onNewBullet}
                  onCollapse={onCollapse}
                  onNavigate={onNavigate}
                  onIndent={onIndent}
                  onOutdent={onOutdent}
                  onZoom={onZoom}
                  mode="theirs"
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default UsersList;