import { useState, useEffect } from "react";
import { BulletPoint } from "@/types/bullet";
import { findBulletAndParent, getAllVisibleBullets } from "@/utils/bulletOperations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useBulletManager = () => {
  const [bullets, setBullets] = useState<BulletPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingOperations, setPendingOperations] = useState<Map<string, Promise<void>>>(new Map());

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

      const bulletMap = new Map();
      const rootBullets: BulletPoint[] = [];

      data?.forEach(bullet => {
        bulletMap.set(bullet.id, {
          id: bullet.id,
          content: bullet.content || "",
          children: [],
          isCollapsed: bullet.is_collapsed,
        });
      });

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

    for (let i = 0; i < bullet.children.length; i++) {
      await saveBullet(bullet.children[i], bullet.id, i);
    }
  };

  const queueOperation = async (operationId: string, operation: () => Promise<void>) => {
    const pendingOp = pendingOperations.get(operationId);
    if (pendingOp) {
      await pendingOp;
    }

    const newOperation = operation();
    setPendingOperations(prev => new Map(prev).set(operationId, newOperation));
    
    try {
      await newOperation;
    } finally {
      setPendingOperations(prev => {
        const updated = new Map(prev);
        updated.delete(operationId);
        return updated;
      });
    }
  };

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
    
    // Optimistic update
    setBullets(prevBullets => {
      const updatedBullets = [...prevBullets];
      const [targetBullet, targetParent] = findBulletAndParent(id, updatedBullets);
      if (targetBullet && targetParent) {
        const targetIndex = targetParent.indexOf(targetBullet);
        targetParent.splice(targetIndex + 1, 0, newBullet);
      }
      return updatedBullets;
    });

    try {
      await queueOperation(newBullet.id, async () => {
        await saveBullet(newBullet, bullet.id, index + 1);
      });
      return newBullet.id;
    } catch (error) {
      // Rollback optimistic update on error
      setBullets(prevBullets => {
        const updatedBullets = [...prevBullets];
        const [_, targetParent] = findBulletAndParent(id, updatedBullets);
        if (targetParent) {
          const newBulletIndex = targetParent.findIndex(b => b.id === newBullet.id);
          if (newBulletIndex !== -1) {
            targetParent.splice(newBulletIndex, 1);
          }
        }
        return updatedBullets;
      });
      console.error("Error creating bullet:", error);
      toast.error("Failed to create bullet");
      return null;
    }
  };

  const createNewRootBullet = async (): Promise<string> => {
    const newBullet = {
      id: crypto.randomUUID(),
      content: "",
      children: [],
      isCollapsed: false,
    };

    // Optimistic update
    setBullets(prevBullets => [...prevBullets, newBullet]);

    try {
      await queueOperation(newBullet.id, async () => {
        await saveBullet(newBullet, null, bullets.length);
      });
      return newBullet.id;
    } catch (error) {
      // Rollback optimistic update on error
      setBullets(prevBullets => prevBullets.filter(b => b.id !== newBullet.id));
      console.error("Error creating root bullet:", error);
      toast.error("Failed to create bullet");
      return newBullet.id;
    }
  };

  const updateBullet = async (id: string, content: string) => {
    // Optimistic update
    setBullets(prevBullets => {
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
      return updateBulletRecursive(prevBullets);
    });

    try {
      await queueOperation(id, async () => {
        const [bullet, parent] = findBulletAndParent(id, bullets);
        if (bullet) {
          await saveBullet(
            { ...bullet, content },
            parent === bullets ? null : parent?.[0]?.id,
            parent?.indexOf(bullet) ?? 0
          );
        }
      });
    } catch (error) {
      // Rollback optimistic update on error
      console.error("Error updating bullet:", error);
      toast.error("Failed to update bullet");
      loadBullets(); // Reload the original state
    }
  };

  const deleteBullet = async (id: string) => {
    const [bulletToDelete, parent] = findBulletAndParent(id, bullets);
    if (!bulletToDelete) return;

    // Optimistic update
    setBullets(prevBullets => {
      const deleteBulletRecursive = (bullets: BulletPoint[]): BulletPoint[] => {
        return bullets.filter((bullet) => {
          if (bullet.id === id) return false;
          bullet.children = deleteBulletRecursive(bullet.children);
          return true;
        });
      };
      return deleteBulletRecursive(prevBullets);
    });

    try {
      await queueOperation(id, async () => {
        const { error } = await supabase
          .from("bullets")
          .delete()
          .eq("id", id);

        if (error) throw error;
      });
    } catch (error) {
      // Rollback optimistic update on error
      console.error("Error deleting bullet:", error);
      toast.error("Failed to delete bullet");
      loadBullets(); // Reload the original state
    }
  };

  const toggleCollapse = async (id: string) => {
    // Optimistic update
    setBullets(prevBullets => {
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
      return toggleCollapseRecursive(prevBullets);
    });

    try {
      await queueOperation(id, async () => {
        const [bullet, parent] = findBulletAndParent(id, bullets);
        if (bullet) {
          await saveBullet(
            { ...bullet, isCollapsed: !bullet.isCollapsed },
            parent === bullets ? null : parent?.[0]?.id,
            parent?.indexOf(bullet) ?? 0
          );
        }
      });
    } catch (error) {
      console.error("Error toggling collapse:", error);
      toast.error("Failed to toggle collapse");
      loadBullets(); // Reload the original state
    }
  };

  const indentBullet = async (id: string) => {
    const [bullet, parent] = findBulletAndParent(id, bullets);
    if (!bullet || !parent) return;

    const index = parent.indexOf(bullet);
    if (index === 0) return;

    const previousBullet = parent[index - 1];

    // Optimistic update
    setBullets(prevBullets => {
      const [targetBullet, targetParent] = findBulletAndParent(id, prevBullets);
      if (targetBullet && targetParent) {
        const targetIndex = targetParent.indexOf(targetBullet);
        if (targetIndex > 0) {
          targetParent.splice(targetIndex, 1);
          targetParent[targetIndex - 1].children.push(targetBullet);
        }
      }
      return [...prevBullets];
    });

    try {
      await queueOperation(id, async () => {
        await saveBullet(bullet, previousBullet.id, previousBullet.children.length);
      });
    } catch (error) {
      console.error("Error indenting bullet:", error);
      toast.error("Failed to indent bullet");
      loadBullets(); // Reload the original state
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

    // Optimistic update
    setBullets(prevBullets => {
      const [targetBullet, targetParent, targetGrandParent] = findBulletAndGrandParent(id, prevBullets);
      if (targetBullet && targetParent && targetGrandParent) {
        const bulletIndex = targetParent.indexOf(targetBullet);
        const parentIndex = targetGrandParent.findIndex(b => b.children.includes(targetBullet));
        if (parentIndex !== -1) {
          targetParent.splice(bulletIndex, 1);
          targetGrandParent.splice(parentIndex + 1, 0, targetBullet);
        }
      }
      return [...prevBullets];
    });

    try {
      await queueOperation(id, async () => {
        await saveBullet(bullet, grandParent === bullets ? null : grandParent[0].id, parentIndex + 1);
      });
    } catch (error) {
      console.error("Error outdenting bullet:", error);
      toast.error("Failed to outdent bullet");
      loadBullets(); // Reload the original state
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