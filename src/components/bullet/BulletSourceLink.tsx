import React from 'react';
import { Link } from 'lucide-react';

interface BulletSourceLinkProps {
  sourceId: string;
  onZoom: (id: string) => void;
}

const BulletSourceLink: React.FC<BulletSourceLinkProps> = ({ sourceId, onZoom }) => {
  return (
    <button
      onClick={() => onZoom(sourceId)}
      className="ml-2 opacity-50 hover:opacity-100 transition-opacity"
      title="Go to original bullet"
    >
      <Link className="w-3 h-3" />
    </button>
  );
};

export default BulletSourceLink;