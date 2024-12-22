import React from 'react';
import BulletItem from './BulletItem';
import { BulletPoint } from '@/types/bullet';

interface User {
  id: string;
  nom_de_plume: string;
  bullets: BulletPoint[];
}

interface UsersListProps {
  users: User[];
  onUserZoom: (userId: string) => void;
}

const UsersList: React.FC<UsersListProps> = ({ users, onUserZoom }) => {
  return (
    <div className="space-y-6">
      {users.map((user) => (
        <div key={user.id} className="space-y-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span 
              className="cursor-pointer text-gray-400 hover:text-[#9b87f5] transition-colors"
              onClick={() => onUserZoom(user.id)}
            >
              ✤
            </span>
            {user.nom_de_plume}
          </h2>
          <div className="pl-6">
            {user.bullets.map((bullet) => (
              <BulletItem
                key={bullet.id}
                bullet={bullet}
                level={0}
                onUpdate={() => {}}
                onDelete={() => {}}
                onNewBullet={() => null}
                onCollapse={() => {}}
                onNavigate={() => {}}
                onZoom={() => {}}
                isWriteMode={false}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default UsersList;