import React from 'react';
import UsersList from "./UsersList";
import { BulletPoint } from "@/types/bullet";
import { User } from "@/types/user";

interface UsersListViewProps {
  users: User[];
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onNewBullet: (id: string) => Promise<string>;
  onCollapse: (id: string) => void;
  onNavigate: (direction: "up" | "down", id: string) => void;
  onIndent: (id: string) => void;
  onOutdent: (id: string) => void;
  onZoom: (id: string) => void;
  theirsBullets: {[key: string]: BulletPoint[]};
  onSetUserBullets: (userId: string, bullets: BulletPoint[]) => void;
  handleNewBullet: (id: string) => Promise<string>;
}

const UsersListView: React.FC<UsersListViewProps> = ({
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
  return (
    <UsersList
      users={users}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onNewBullet={onNewBullet}
      onCollapse={onCollapse}
      onNavigate={onNavigate}
      onIndent={onIndent}
      onOutdent={onOutdent}
      onZoom={onZoom}
      theirsBullets={theirsBullets}
      onSetUserBullets={onSetUserBullets}
      handleNewBullet={handleNewBullet}
    />
  );
};

export default UsersListView;