import React from 'react';

interface BulletLinkProps {
  url: string;
  mode: "yours" | "theirs";
}

const BulletLink: React.FC<BulletLinkProps> = ({ url, mode }) => {
  const handleClick = (e: React.MouseEvent) => {
    if (mode === "yours") {
      // In yours mode, only open link with Ctrl/Cmd + click
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        return;
      }
    }
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-800 underline"
      onClick={handleClick}
    >
      {url}
    </a>
  );
};

export default BulletLink;