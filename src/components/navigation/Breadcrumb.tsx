import React from "react";
import { BookOpen, ChevronRight } from "lucide-react";
import { BulletPoint } from "@/types/bullet";

interface BreadcrumbProps {
  path: BulletPoint[];
  onNavigate: (bulletId: string | null) => void;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ path, onNavigate }) => {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <button
        onClick={() => onNavigate(null)}
        className="hover:text-gray-900 transition-colors"
      >
        <BookOpen className="w-4 h-4" />
      </button>
      {path.map((bullet) => (
        <React.Fragment key={bullet.id}>
          <ChevronRight className="w-4 h-4" />
          <button
            onClick={() => onNavigate(bullet.id)}
            className="hover:text-gray-900 transition-colors max-w-[200px] truncate text-lg font-medium"
          >
            {bullet.content || "Untitled"}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default Breadcrumb;