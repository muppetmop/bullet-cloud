import React from 'react';
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import UsersList from "./UsersList";
import { BulletPoint } from "@/types/bullet";

interface UsersListViewProps {
  users: any[];
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
  handleNewBullet: () => void;
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
    <>
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
      />
      <button
        onClick={handleNewBullet}
        className="new-bullet-button w-full flex items-center gap-2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
        tabIndex={0}
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm">Add new bullet</span>
      </button>
    </>
  );
};

export default UsersListView;