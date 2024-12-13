import { useState, useEffect } from "react";
import { BulletPoint } from "@/types/bullet";
import { findBulletAndParent, getAllVisibleBullets } from "@/utils/bulletOperations";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

export const useBulletManager = () => {
  const [bullets, setBullets] = useState<BulletPoint[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load bullets from Supabase
  useEffect(() => {
    const loadBullets = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("bullets")
        .select("*")
        .order("position");

      if (error) {
        toast({
          title: "Error loading bullets",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Transform the flat data into a tree structure
      const bulletMap = new Map();
      data.forEach((bullet) => {
        bulletMap.set(bullet.id, {
          id: bullet.id,
          content: bullet.content,
          children: [],
          isCollapsed: bullet.is_collapsed,
        });
      });

      data.forEach((bullet) => {
        if (bullet.parent_id) {
          const parent = bulletMap.get(bullet.parent_id);
          if (parent) {
            parent.children.push(bulletMap.get(bullet.id));
          }
        }
      });

      const rootBullets = data
        .filter((bullet) => !bullet.parent_id)
        .map((bullet) => bulletMap.get(bullet.id));

      setBullets(rootBullets.length ? rootBullets : [{
        id: crypto.randomUUID(),
        content: "",
        children: [],
        isCollapsed: false,
      }]);
    };

    loadBullets();
  }, [user]);

  const createNewBullet = async (id: string): Promise<string | null> => {
    if (!user) return null;

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
      user_id: user.id,
    });

    if (error) {
      toast({
        title: "Error creating bullet",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }

    return newBullet.id;
  };

  const createNewRootBullet = async () => {
    if (!user) return null;

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
      user_id: user.id,
    });

    if (error) {
      toast({
        title: "Error creating root bullet",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }

    return newBullet.id;
  };

  const updateBullet = async (id: string, content: string) => {
    if (!user) return;

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
      toast({
        title: "Error updating bullet",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteBullet = async (id: string) => {
    if (!user) return;

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

    // Save to Supabase
    const { error } = await supabase
      .from("bullets")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error deleting bullet",
        description: error.message,
        variant: "destructive",
      });
    }

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

    // Save to Supabase
    const { error } = await supabase
      .from("bullets")
      .update({ is_collapsed: !bullets.find(b => b.id === id)?.isCollapsed })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error toggling collapse",
        description: error.message,
        variant: "destructive",
      });
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

    // Save to Supabase
    const { error } = await supabase
      .from("bullets")
      .update({ parent_id: previousBullet.id })
      .eq("id", bullet.id);

    if (error) {
      toast({
        title: "Error indenting bullet",
        description: error.message,
        variant: "destructive",
      });
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

    // Save to Supabase
    const { error } = await supabase
      .from("bullets")
      .update({ parent_id: grandParent[parentIndex + 1]?.id || null })
      .eq("id", bullet.id);

    if (error) {
      toast({
        title: "Error outdenting bullet",
        description: error.message,
        variant: "destructive",
      });
    }
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