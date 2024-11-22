import React, { useState } from "react";
import BulletItem from "./BulletItem";
import { BulletPoint } from "@/types/bullet";
import { Plus } from "lucide-react";

const TaskManager = () => {
  const [bullets, setBullets] = useState<BulletPoint[]>([
    { id: crypto.randomUUID(), content: "", children: [], isCollapsed: false },
  ]);

  const findBulletAndParent = (
    id: string,
    bullets: BulletPoint[],
    parent: BulletPoint[] | null = null
  ): [BulletPoint | null, BulletPoint[] | null] => {
    for (let i = 0; i < bullets.length; i++) {
      if (bullets[i].id === id) {
        return [bullets[i], parent || bullets];
      }
      if (!bullets[i].isCollapsed) {
        const [found, foundParent] = findBulletAndParent(id, bullets[i].children, bullets[i].children);
        if (found) return [found, foundParent];
      }
    }
    return [null, null];
  };

  const getAllVisibleBullets = (bullets: BulletPoint[]): BulletPoint[] => {
    return bullets.reduce((acc: BulletPoint[], bullet) => {
      return [
        ...acc,
        bullet,
        ...(bullet.isCollapsed ? [] : getAllVisibleBullets(bullet.children)),
      ];
    }, []);
  };

  const createNewBullet = (id: string) => {
    const [bullet, parent] = findBulletAndParent(id, bullets);
    if (!bullet || !parent) return;

    const newBullet = { id: crypto.randomUUID(), content: "", children: [], isCollapsed: false };
    const index = parent.indexOf(bullet);
    parent.splice(index + 1, 0, newBullet);
    setBullets([...bullets]);

    setTimeout(() => {
      const newBulletElement = document.querySelector(`[data-id="${newBullet.id}"] .bullet-content`) as HTMLElement;
      if (newBulletElement) {
        newBulletElement.focus();
      }
    }, 0);
  };

  const createNewRootBullet = () => {
    const newBullet = { id: crypto.randomUUID(), content: "", children: [], isCollapsed: false };
    setBullets([...bullets, newBullet]);

    setTimeout(() => {
      const newBulletElement = document.querySelector(`[data-id="${newBullet.id}"] .bullet-content`) as HTMLElement;
      if (newBulletElement) {
        newBulletElement.focus();
      }
    }, 0);
  };

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

  const toggleCollapse = (id: string) => {
    const toggleCollapseRecursive = (bullets: BulletPoint[]): BulletPoint[] => {
      return bullets.map((bullet) => {
        if (bullet.id === id) {
          return { ...bullet, isCollapsed: !bullet.isCollapsed };
        }
        return {
          ...bullet,
          children: toggleCollapseRecursive(bullet.children),
        };
      });
    };

    setBullets(toggleCollapseRecursive(bullets));
  };

  const handleNavigate = (direction: "up" | "down", currentId: string) => {
    const visibleBullets = getAllVisibleBullets(bullets);
    const currentIndex = visibleBullets.findIndex((b) => b.id === currentId);
    
    let nextBullet: BulletPoint | undefined;
    
    if (direction === "up") {
      nextBullet = visibleBullets[currentIndex - 1];
    } else if (direction === "down") {
      if (currentIndex === visibleBullets.length - 1) {
        // If we're at the last bullet, focus the plus button
        const plusButton = document.querySelector(".new-bullet-button") as HTMLElement;
        if (plusButton) {
          plusButton.focus();
          return;
        }
      }
      nextBullet = visibleBullets[currentIndex + 1];
    }

    if (nextBullet) {
      const nextElement = document.querySelector(`[data-id="${nextBullet.id}"] .bullet-content`) as HTMLElement;
      if (nextElement) {
        nextElement.focus();
        // Place cursor at the end of the content
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(nextElement);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
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
          onNewBullet={createNewBullet}
          onCollapse={toggleCollapse}
          onNavigate={handleNavigate}
        />
      ))}
      <button
        onClick={createNewRootBullet}
        className="new-bullet-button w-full flex items-center gap-2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            createNewRootBullet();
          } else if (e.key === "ArrowUp" && bullets.length > 0) {
            const lastBullet = getAllVisibleBullets(bullets).pop();
            if (lastBullet) {
              const lastElement = document.querySelector(`[data-id="${lastBullet.id}"] .bullet-content`) as HTMLElement;
              if (lastElement) {
                lastElement.focus();
              }
            }
          }
        }}
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm">Add new bullet</span>
      </button>
    </div>
  );
};

export default TaskManager;