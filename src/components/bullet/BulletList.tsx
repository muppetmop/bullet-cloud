import React from "react";
import { BulletPoint } from "@/types/bullet";
import BulletItem from "../BulletItem";

interface BulletListProps {
  bullets: BulletPoint[];
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onNewBullet: (id: string) => Promise<string | null>;
  onCollapse: (id: string) => void;
  onNavigate: (direction: "up" | "down", id: string) => void;
  onIndent: (id: string) => void;
  onOutdent: (id: string) => void;
  onZoom: (id: string) => void;
  mode?: "yours" | "theirs";
  onTransferChildren?: (fromBulletId: string, toBulletId: string) => void;
}

const BulletList: React.FC<BulletListProps> = ({
  bullets,
  onUpdate,
  onDelete,
  onNewBullet,
  onCollapse,
  onNavigate,
  onIndent,
  onOutdent,
  onZoom,
  mode,
  onTransferChildren
}) => {
  return (
    <>
      {bullets.map((bullet) => (
        <BulletItem
          key={bullet.id}
          bullet={bullet}
          level={0}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onNewBullet={onNewBullet}
          onCollapse={onCollapse}
          onNavigate={onNavigate}
          onIndent={onIndent}
          onOutdent={onOutdent}
          onZoom={onZoom}
          mode={mode}
          onTransferChildren={onTransferChildren}
        />
      ))}
    </>
  );
};

export default BulletList;