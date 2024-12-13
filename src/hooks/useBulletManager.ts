import { useState, useEffect } from "react";
import { BulletPoint } from "@/types/bullet";
import { findBulletAndParent, getAllVisibleBullets } from "@/utils/bulletOperations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useBulletManager = () => {
  const [bullets, setBullets] = useState<BulletPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load bullets on mount
  useEffect(() => {
    loadBullets();
  }, []);

  const loadBullets = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { data, error } = await supabase
        .from("bullets")
        .select("*")
        .eq('user_id', session.session.user.id)
        .order("position");

      if (error) throw error;

      // Convert flat structure to tree
      const bulletMap = new Map();
      const rootBullets: BulletPoint[] = [];

      // First pass: Create all bullet objects
      data?.forEach(bullet => {
        bulletMap.set(bullet.id, {
          id: bullet.id,
          content: bullet.content || "",
          children: [],
          isCollapsed: bullet.is_collapsed,
        });
      });

      // Second pass: Build the tree structure
      data?.forEach(bullet => {
        const bulletObj = bulletMap.get(bullet.id);
        if (bullet.parent_id) {
          const parent = bulletMap.get(bullet.parent_id);
          if (parent) {
            parent.children.push(bulletObj);
          }
        } else {
          rootBullets.push(bulletObj);
        }
      });

      setBullets(rootBullets.length > 0 ? rootBullets : [{
        id: crypto.randomUUID(),
        content: "",
        children: [],
        isCollapsed: false
      }]);
    } catch (error) {
      console.error("Error loading bullets:", error);
      toast.error("Failed to load bullets");
    } finally {
      setIsLoading(false);
    }
  };

  const saveBullet = async (bullet: BulletPoint, parentId: string | null = null, position: number) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error("No active session");
      }

      const { error } = await supabase
        .from("bullets")
        .upsert({
          id: bullet.id,
          content: bullet.content,
          parent_id: parentId,
          position: position,
          is_collapsed: bullet.isCollapsed,
          user_id: session.session.user.id,
        });

      if (error) throw error;

      // Recursively save children
      for (let i = 0; i < bullet.children.length; i++) {
        await saveBullet(bullet.children[i], bullet.id, i);
      }
    } catch (error) {
      console.error("Error saving bullet:", error);
      toast.error("Failed to save changes");
    }
  };

  const saveAllBullets = async () => {
    for (let i = 0; i < bullets.length; i++) {
      await saveBullet(bullets[i], null, i);
    }
  };

  // Wrap existing methods to include saving
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
    
    await saveAllBullets();
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
    
    await saveAllBullets();
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

    const newBullets = updateBulletRecursive(bullets);
    setBullets(newBullets);
    await saveAllBullets();
  };

  const deleteBullet = async (id: string) => {
    const deleteBulletRecursive = (bullets: BulletPoint[]): BulletPoint[] => {
      return bullets.filter((bullet) => {
        if (bullet.id === id) return false;
        bullet.children = deleteBulletRecursive(bullet.children);
        return true;
      });
    };

    const newBullets = deleteBulletRecursive(bullets);
    setBullets(newBullets);
    
    try {
      const { error } = await supabase
        .from("bullets")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting bullet:", error);
      toast.error("Failed to delete bullet");
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

    const newBullets = toggleCollapseRecursive(bullets);
    setBullets(newBullets);
    await saveAllBullets();
  };

  const indentBullet = (id: string) => {
    const [bullet, parent] = findBulletAndParent(id, bullets);
    if (!bullet || !parent) return;

    const index = parent.indexOf(bullet);
    if (index === 0) return;

    const previousBullet = parent[index - 1];
    parent.splice(index, 1);
    previousBullet.children.push(bullet);
    setBullets([...bullets]);
  };

  const outdentBullet = (id: string) => {
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