import React, { useState, useEffect } from "react";
import BulletItem from "./BulletItem";
import { BulletPoint } from "@/types/bullet";

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
      const [found, foundParent] = findBulletAndParent(id, bullets[i].children, bullets[i].children);
      if (found) return [found, foundParent];
    }
    return [null, null];
  };

  const getAllBullets = (bullets: BulletPoint[]): BulletPoint[] => {
    return bullets.reduce((acc: BulletPoint[], bullet) => {
      return [...acc, bullet, ...getAllBullets(bullet.isCollapsed ? [] : bullet.children)];
    }, []);
  };

  const createNewBullet = (id: string) => {
    const [bullet, parent] = findBulletAndParent(id, bullets);
    if (!bullet || !parent) return;

    const newBullet = { id: crypto.randomUUID(), content: "", children: [], isCollapsed: false };
    const index = parent.indexOf(bullet);
    parent.splice(index + 1, 0, newBullet);
    setBullets([...bullets]);

    // Focus the new bullet after render
    setTimeout(() => {
      const newBulletElement = document.querySelector(`[data-id="${newBullet.id}"]`) as HTMLElement;
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

  const handleNavigate = (direction: "up" | "down" | "left" | "right", currentId: string) => {
    const allBullets = getAllBullets(bullets);
    const currentIndex = allBullets.findIndex((b) => b.id === currentId);
    
    let nextBullet: BulletPoint | undefined;
    
    if (direction === "up") {
      nextBullet = allBullets[currentIndex - 1];
    } else if (direction === "down") {
      nextBullet = allBullets[currentIndex + 1];
    } else if (direction === "left") {
      const [current, parent] = findBulletAndParent(currentId, bullets);
      if (parent && parent !== bullets) {
        const parentBullet = allBullets.find((b) => b.children.includes(current!));
        nextBullet = parentBullet;
      }
    } else if (direction === "right") {
      const [current] = findBulletAndParent(currentId, bullets);
      if (current && current.children.length > 0 && !current.isCollapsed) {
        nextBullet = current.children[0];
      }
    }

    if (nextBullet) {
      const nextElement = document.querySelector(`[data-id="${nextBullet.id}"]`) as HTMLElement;
      if (nextElement) {
        nextElement.focus();
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
    </div>
  );
};

export default TaskManager;