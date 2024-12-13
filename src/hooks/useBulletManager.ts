import { useState, useEffect } from "react";
import { BulletPoint } from "@/types/bullet";
import { findBulletAndParent, getAllVisibleBullets } from "@/utils/bulletOperations";
import { useDebounceSync } from "./useDebounceSync";
import { supabase } from "@/integrations/supabase/client";

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
  const { saveBulletToSupabase } = useDebounceSync();

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
        return;
      }

      if (data && data.length > 0) {
        const transformedBullets = data.map(transformDatabaseBullet);
        setBullets(transformedBullets);
      } else {
        // Initialize with an empty bullet if no data exists
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
          return;
        }

        setBullets([transformDatabaseBullet(newBullet)]);
      }
    };

    loadBullets();
  }, []);

  const createNewBullet = async (id: string): Promise<string | null> => {
    const [bullet, parent] = findBulletAndParent(id, bullets);
    if (!bullet || !parent) return null;

    const session = await supabase.auth.getSession();
    if (!session.data.session?.user.id) return null;

    const newBullet: BulletPoint = {
      id: crypto.randomUUID(),
      content: "",
      children: [],
      isCollapsed: false,
      user_id: session.data.session.user.id,
      position: parent.indexOf(bullet) + 1,
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
      console.error("Error creating new bullet:", error);
      return null;
    }

    parent.splice(parent.indexOf(bullet) + 1, 0, newBullet);
    setBullets([...bullets]);

    return newBullet.id;
  };

  const createNewRootBullet = async (): Promise<string> => {
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
      throw error;
    }

    setBullets([...bullets, newBullet]);
    return newBullet.id;
  };

  const updateBullet = (id: string, content: string) => {
    const updateBulletRecursive = (bullets: BulletPoint[]): BulletPoint[] => {
      return bullets.map((bullet) => {
        if (bullet.id === id) {
          // Trigger debounced save when content changes
          saveBulletToSupabase(id, content);
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

    // Focus on the previous bullet after deletion
    if (previousBullet) {
      setTimeout(() => {
        const previousElement = document.querySelector(
          `[data-id="${previousBullet.id}"] .bullet-content`
        ) as HTMLElement;
        if (previousElement) {
          previousElement.focus();
          // Set cursor at the end of the content
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