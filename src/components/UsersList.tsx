import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
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
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  const toggleUser = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  return (
    <div className="space-y-2">
      {users.map((user) => (
        <div key={user.id} className="space-y-2">
          <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md">
            <button
              onClick={() => toggleUser(user.id)}
              className="text-gray-400 hover:text-gray-600"
            >
              {expandedUsers.has(user.id) ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => onUserZoom(user.id)}
              className="text-gray-400 hover:text-[#9b87f5]"
            >
              <BookOpen className="w-4 h-4" />
            </button>
            <span className="text-gray-700">{user.nom_de_plume}</span>
          </div>
          {expandedUsers.has(user.id) && (
            <div className="pl-8">
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
          )}
        </div>
      ))}
    </div>
  );
};

export default UsersList;