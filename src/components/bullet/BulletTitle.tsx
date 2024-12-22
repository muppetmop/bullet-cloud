import React from "react";
import { BulletPoint } from "@/types/bullet";

interface BulletTitleProps {
  currentBulletId: string | null;
  breadcrumbPath: { id: string; content: string }[];
  onTitleChange: (event: React.FocusEvent<HTMLHeadingElement>) => void;
  onTitleKeyDown: (event: React.KeyboardEvent<HTMLHeadingElement>) => void;
}

const BulletTitle: React.FC<BulletTitleProps> = ({
  currentBulletId,
  breadcrumbPath,
  onTitleChange,
  onTitleKeyDown,
}) => {
  if (!currentBulletId) return null;

  return (
    <h1 
      className="text-2xl font-semibold mb-6 outline-none"
      contentEditable
      suppressContentEditableWarning
      onBlur={onTitleChange}
      onKeyDown={onTitleKeyDown}
    >
      {breadcrumbPath[breadcrumbPath.length - 1]?.content || "Untitled"}
    </h1>
  );
};

export default BulletTitle;