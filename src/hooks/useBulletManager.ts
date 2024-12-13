import { useState, useEffect } from "react";
import { BulletPoint } from "@/types/bullet";
import { findBulletAndParent, getAllVisibleBullets } from "@/utils/bulletOperations";
import { supabase } from "@/integrations/supabase/client";

export const useBulletManager = () => {
  const [bullets, setBullets] = useState<BulletPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load bullets from Supabase on mount
  useEffect(() => {
    const loadBullets = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { data: bulletData, error } = await supabase
        .from("bullets")
        .select("*")
        .order("position");

      if (error) {
        console.error("Error loading bullets:", error);
        return;
      }

      // Convert flat bullet data to tree structure
      const bulletMap = new Map<string, BulletPoint>();
      const rootBullets: BulletPoint[] = [];

      // First pass: create BulletPoint objects
      bulletData.forEach((bullet) => {
        bulletMap.set(bullet.id, {
          id: bullet.id,
          content: bullet.content || "",
          children: [],
          isCollapsed: bullet.is_collapsed,
        });
      });

      // Second pass: build tree structure
      bulletData.forEach((bullet) => {
        const bulletPoint = bulletMap.get(bullet.id);
        if (bulletPoint) {
          if (bullet.parent_id) {
            const parent = bulletMap.get(bullet.parent_id);
            if (parent) {
              parent.children.push(bulletPoint);
            }
          } else {
            rootBullets.push(bulletPoint);
          }
        }
      });

      setBullets(rootBullets.length > 0 ? rootBullets : [{
        id: crypto.randomUUID(),
        content: "",
        children: [],
        isCollapsed: false
      }]);
      setIsLoading(false);
    };

    loadBullets();
  }, []);

  const createNewBullet = async (id: string): Promise<string | null> => {
    const [bullet, parent] = findBulletAndParent(id, bullets);
    if (!bullet || !parent) return null;

    const newBullet = {
      id: crypto.randomUUID(),
      content: "",
      children: [],
      isCollapsed: false,
    };

    const index = parent.indexOf(bullet);
    parent.splice(index + 1, 0, newBullet);
    setBullets([...bullets]);

    // Save to Supabase
    const { error } = await supabase.from("bullets").insert({
      id: newBullet.id,
      content: newBullet.content,
      parent_id: parent === bullets ? null : bullet.id,
      position: index + 1,
      is_collapsed: newBullet.isCollapsed,
    });

    if (error) {
      console.error("Error creating bullet:", error);
      return null;
    }

    return newBullet.id;
  };

  const createNewRootBullet = async (): Promise<string> => {
    const newBullet = {
      id: crypto.randomUUID(),
      content: "",
      children: [],
      isCollapsed: false,
    };

    setBullets([...bullets, newBullet]);

    // Save to Supabase
    const { error } = await supabase.from("bullets").insert({
      id: newBullet.id,
      content: newBullet.content,
      parent_id: null,
      position: bullets.length,
      is_collapsed: newBullet.isCollapsed,
    });

    if (error) {
      console.error("Error creating root bullet:", error);
    }

    return newBullet.id;
  };

  const updateBullet = async (id: string, content: string) => {
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

    // Save to Supabase
    const { error } = await supabase
      .from("bullets")
      .update({ content })
      .eq("id", id);

    if (error) {
      console.error("Error updating bullet:", error);
    }
  };

  const deleteBullet = async (id: string) => {
    const visibleBullets = getAllVisibleBullets(bullets);
    const currentIndex = visibleBullets.findIndex(b => b.id === id);
    const previousBullet = visibleBullets[currentIndex - 1];

    const deleteBulletRecursive = (bullets: BulletPoint[]): BulletPoint[] => {
      return bullets.filter((bullet) => {
        if (bullet.id === id) return false;
        bullet.children = deleteBulletRecursive(bullet.children);
        return true;
      });
    };

    setBullets(deleteBulletRecursive(bullets));

    // Delete from Supabase
    const { error } = await supabase
      .from("bullets")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting bullet:", error);
    }

    // Focus on the previous bullet after deletion
    if (previousBullet) {
      setTimeout(() => {
        const previousElement = document.querySelector(
          `[data-id="${previousBullet.id}"] .bullet-content`
        ) as HTMLElement;
        if (previousElement) {
          previousElement.focus();
          const range = document.createRange();
          const selection = window.getSelection();
          range.selectNodeContents(previousElement);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }, 0);
    }
  };

  const toggleCollapse = async (id: string) => {
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

    // Update in Supabase
    const bullet = getAllVisibleBullets(bullets).find(b => b.id === id);
    if (bullet) {
      const { error } = await supabase
        .from("bullets")
        .update({ is_collapsed: !bullet.isCollapsed })
        .eq("id", id);

      if (error) {
        console.error("Error toggling collapse:", error);
      }
    }
  };

  const indentBullet = async (id: string) => {
    const [bullet, parent] = findBulletAndParent(id, bullets);
    if (!bullet || !parent) return;

    const index = parent.indexOf(bullet);
    if (index === 0) return;

    const previousBullet = parent[index - 1];
    parent.splice(index, 1);
    previousBullet.children.push(bullet);
    setBullets([...bullets]);

    // Update in Supabase
    const { error } = await supabase
      .from("bullets")
      .update({
        parent_id: previousBullet.id,
        position: previousBullet.children.length - 1,
      })
      .eq("id", id);

    if (error) {
      console.error("Error indenting bullet:", error);
    }
  };

  const outdentBullet = async (id: string) => {
    const findBulletAndGrandParent = (
      id: string,
      bullets: BulletPoint[],
      parent: BulletPoint[] | null = null,
      grandParent: BulletPoint[] | null = null
    ): [BulletPoint | null, BulletPoint[] | null, BulletPoint[] | null] => {
      for (let i = 0; i < bullets.length; i++) {
        if (bullets[i].id === id) {
          return [bullets[i], parent, grandParent];
        }
        const [found, foundParent, foundGrandParent] = findBulletAndGrandParent(
          id,
          bullets[i].children,
          bullets[i].children,
          parent || bullets
        );
        if (found) return [found, foundParent, foundGrandParent];
      }
      return [null, null, null];
    };

    const [bullet, parent, grandParent] = findBulletAndGrandParent(id, bullets);
    if (!bullet || !parent || !grandParent) return;

    const parentIndex = grandParent.findIndex((b) => 
      b.children.includes(bullet)
    );
    if (parentIndex === -1) return;

    const bulletIndex = parent.indexOf(bullet);
    parent.splice(bulletIndex, 1);
    grandParent.splice(parentIndex + 1, 0, bullet);
    setBullets([...bullets]);

    // Update in Supabase
    const { error } = await supabase
      .from("bullets")
      .update({
        parent_id: null,
        position: parentIndex + 1,
      })
      .eq("id", id);

    if (error) {
      console.error("Error outdenting bullet:", error);
    }
  };

  return {
    bullets,
    isLoading,
    findBulletAndParent,
    getAllVisibleBullets,
    createNewBullet,
    createNewRootBullet,
    updateBullet,
    deleteBullet,
    toggleCollapse,
    indentBullet,
    outdentBullet,
  };
};