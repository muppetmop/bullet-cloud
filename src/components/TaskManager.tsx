import React, { useState, useRef, KeyboardEvent } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

interface BulletPoint {
  id: string;
  content: string;
  children: BulletPoint[];
  isCollapsed: boolean;
}

const BulletItem = ({
  bullet,
  level,
  onUpdate,
  onDelete,
  onIndent,
  onOutdent,
}: {
  bullet: BulletPoint;
  level: number;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onIndent: (id: string) => void;
  onOutdent: (id: string) => void;
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const newBullet = { id: crypto.randomUUID(), content: "", children: [], isCollapsed: false };
      const parent = bullet.children;
      parent.push(newBullet);
      onUpdate(bullet.id, bullet.content);
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        onOutdent(bullet.id);
      } else {
        onIndent(bullet.id);
      }
    } else if (e.key === "Backspace" && !bullet.content && !bullet.children.length) {
      e.preventDefault();
      onDelete(bullet.id);
    }
  };

  return (
    <div className="bullet-item">
      <div className="flex items-start gap-1">
        {bullet.children.length > 0 ? (
          <button
            className="collapse-button mt-1"
            onClick={() => {
              bullet.isCollapsed = !bullet.isCollapsed;
              onUpdate(bullet.id, bullet.content);
            }}
          >
            {bullet.isCollapsed ? (
              <ChevronRight className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        ) : (
          <span className="w-4 h-4 inline-flex items-center justify-center mt-1">•</span>
        )}
        <div
          ref={contentRef}
          className="bullet-content py-1"
          contentEditable
          onBlur={(e) => onUpdate(bullet.id, e.currentTarget.textContent || "")}
          onKeyDown={handleKeyDown}
          suppressContentEditableWarning
        >
          {bullet.content}
        </div>
      </div>
      {!bullet.isCollapsed && bullet.children.length > 0 && (
        <div className="bullet-children">
          {bullet.children.map((child) => (
            <BulletItem
              key={child.id}
              bullet={child}
              level={level + 1}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onIndent={onIndent}
              onOutdent={onOutdent}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TaskManager = () => {
  const [bullets, setBullets] = useState<BulletPoint[]>([
    { id: crypto.randomUUID(), content: "", children: [], isCollapsed: false },
  ]);

  const updateBullet = (id: string, content: string) => {
    const updateBulletRecursive = (bullets: BulletPoint[]): BulletPoint[] => {
      return bullets.map((bullet) => {
        if (bullet.id === id) {
          return { ...bullet, content };
        }
        return {
          ...bullet,
          children: updateBulletRecursive(bullet.children),
        };
      });
    };

    setBullets(updateBulletRecursive(bullets));
  };

  const deleteBullet = (id: string) => {
    const deleteBulletRecursive = (bullets: BulletPoint[]): BulletPoint[] => {
      return bullets.filter((bullet) => {
        if (bullet.id === id) return false;
        bullet.children = deleteBulletRecursive(bullet.children);
        return true;
      });
    };

    setBullets(deleteBulletRecursive(bullets));
  };

  const indentBullet = (id: string) => {
    const indentBulletRecursive = (bullets: BulletPoint[]): BulletPoint[] => {
      for (let i = 0; i < bullets.length; i++) {
        if (bullets[i].id === id && i > 0) {
          const bullet = bullets[i];
          bullets[i - 1].children.push(bullet);
          bullets.splice(i, 1);
          return bullets;
        }
        bullets[i].children = indentBulletRecursive(bullets[i].children);
      }
      return bullets;
    };

    setBullets(indentBulletRecursive([...bullets]));
  };

  const outdentBullet = (id: string) => {
    const outdentBulletRecursive = (
      bullets: BulletPoint[],
      parentIndex: number,
      parentBullets: BulletPoint[]
    ): boolean => {
      for (let i = 0; i < bullets.length; i++) {
        if (bullets[i].id === id) {
          const bullet = bullets[i];
          bullets.splice(i, 1);
          parentBullets.splice(parentIndex + 1, 0, bullet);
          return true;
        }
        if (outdentBulletRecursive(bullets[i].children, i, bullets)) {
          return true;
        }
      }
      return false;
    };

    setBullets((prevBullets) => {
      const newBullets = [...prevBullets];
      outdentBulletRecursive(newBullets, -1, newBullets);
      return newBullets;
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      {bullets.map((bullet) => (
        <BulletItem
          key={bullet.id}
          bullet={bullet}
          level={0}
          onUpdate={updateBullet}
          onDelete={deleteBullet}
          onIndent={indentBullet}
          onOutdent={outdentBullet}
        />
      ))}
    </div>
  );
};

export default TaskManager;