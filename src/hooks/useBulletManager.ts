import { useState, useEffect } from "react";
import { BulletPoint } from "@/types/bullet";
import { findBulletAndParent, getAllVisibleBullets } from "@/utils/bulletOperations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const transformDatabaseBullet = (dbBullet: any): BulletPoint => ({
  id: dbBullet.id,
  content: dbBullet.content || "",
  children: [],
  isCollapsed: dbBullet.is_collapsed,
  parent_id: dbBullet.parent_id,
  position: dbBullet.position,
  user_id: dbBullet.user_id,
  created_at: dbBullet.created_at,
  updated_at: dbBullet.updated_at
});

export const useBulletManager = () => {
  const [bullets, setBullets] = useState<BulletPoint[]>([]);

  useEffect(() => {
    const loadBullets = async () => {
      const session = await supabase.auth.getSession();
      if (!session.data.session?.user.id) return;

      const { data, error } = await supabase
        .from("bullets")
        .select("*")
        .eq("user_id", session.data.session.user.id)
        .order("position");

      if (error) {
        console.error("Error loading bullets:", error);
        toast.error("Failed to load bullets");
        return;
      }

      if (data && data.length > 0) {
        const transformedBullets = data.map(transformDatabaseBullet);
        setBullets(transformedBullets);
      } else {
        const { data: newBullet, error: createError } = await supabase
          .from("bullets")
          .insert([
            {
              content: "",
              user_id: session.data.session.user.id,
              position: 0,
              is_collapsed: false
            }
          ])
          .select()
          .single();

        if (createError) {
          console.error("Error creating initial bullet:", createError);
          toast.error("Failed to create initial bullet");
          return;
        }

        setBullets([transformDatabaseBullet(newBullet)]);
      }
    };

    loadBullets();
  }, []);

  const createNewBullet = async (id: string): Promise<string | null> => {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user.id) return null;

    const [bullet, parent] = findBulletAndParent(id, bullets);
    if (!bullet || !parent) return null;

    const newPosition = parent.indexOf(bullet) + 1;
    const newBullet: BulletPoint = {
      id: crypto.randomUUID(),
      content: "",
      children: [],
      isCollapsed: false,
      parent_id: null,
      position: newPosition,
      user_id: session.data.session.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from("bullets")
      .insert([{
        id: newBullet.id,
        content: newBullet.content,
        user_id: newBullet.user_id,
        position: newBullet.position,
        is_collapsed: newBullet.isCollapsed,
        parent_id: newBullet.parent_id,
        created_at: newBullet.created_at,
        updated_at: newBullet.updated_at
      }]);

    if (error) {
      console.error("Error creating new bullet:", error);
      toast.error("Failed to create new bullet");
      return null;
    }

    parent.splice(parent.indexOf(bullet) + 1, 0, newBullet);
    setBullets([...bullets]);

    return newBullet.id;
  };

  const createNewRootBullet = async () => {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user.id) throw new Error("No user session");

    const newBullet: BulletPoint = {
      id: crypto.randomUUID(),
      content: "",
      children: [],
      isCollapsed: false,
      position: bullets.length,
      user_id: session.data.session.user.id,
      parent_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from("bullets")
      .insert([{
        id: newBullet.id,
        content: newBullet.content,
        user_id: newBullet.user_id,
        position: newBullet.position,
        is_collapsed: newBullet.isCollapsed,
        parent_id: newBullet.parent_id,
        created_at: newBullet.created_at,
        updated_at: newBullet.updated_at
      }]);

    if (error) {
      console.error("Error creating new root bullet:", error);
      toast.error("Failed to create new bullet");
      throw error;
    }

    setBullets([...bullets, newBullet]);
    return newBullet.id;
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

  const deleteBullet = async (id: string) => {
    const { error } = await supabase
      .from("bullets")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting bullet:", error);
      toast.error("Failed to delete bullet");
      return;
    }

    const deleteBulletRecursive = (bullets: BulletPoint[]): BulletPoint[] => {
      return bullets.filter((bullet) => {
        if (bullet.id === id) return false;
        bullet.children = deleteBulletRecursive(bullet.children);
        return true;
      });
    };

    setBullets(deleteBulletRecursive(bullets));
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