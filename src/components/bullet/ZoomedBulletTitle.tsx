import React from 'react';

interface ZoomedBulletTitleProps {
  content: string;
  mode: "yours" | "theirs";
}

const ZoomedBulletTitle: React.FC<ZoomedBulletTitleProps> = ({ content, mode }) => {
  return (
    <h1 className="text-2xl font-semibold mb-6 outline-none">
      {content}
    </h1>
  );
};

export default ZoomedBulletTitle;