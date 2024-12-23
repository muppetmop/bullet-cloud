import React from 'react';

interface BulletWrapperProps {
  mode: "yours" | "theirs";
  children: React.ReactNode;
}

const BulletWrapper: React.FC<BulletWrapperProps> = ({ mode, children }) => {
  return (
    <div className={`bullet-wrapper ${mode === "theirs" ? "theirs-mode" : ""}`}>
      {children}
    </div>
  );
};

export default BulletWrapper;