import { BulletPoint } from "@/types/bullet";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { findBulletAndParent, getAllVisibleBullets } from "@/utils/bulletOperations";

export const useBulletModification = (
  bullets: BulletPoint[],
  setBullets: (bullets: BulletPoint[]) => void
) => {
  const { user } = useAuth();
  const { toast } = useToast();

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

  const getAllChildrenIds = (bullet: BulletPoint): string[] => {
    let ids: string[] = [bullet.id];
    bullet.children.forEach(child => {
      ids = [...ids, ...getAllChildrenIds(child)];
    });
    return ids;
  };

  const deleteBullet = async (id: string) => {
    if (!user) return;

    const visibleBullets = getAllVisibleBullets(bullets);
    const currentIndex = visibleBullets.findIndex(b => b.id === id);
    const previousBullet = visibleBullets[currentIndex - 1];

    // Find the bullet to delete and get all its children's IDs
    const bulletToDelete = visibleBullets.find(b => b.id === id);
    if (!bulletToDelete) return;

    const idsToDelete = getAllChildrenIds(bulletToDelete);

    // Delete all bullets (parent and children) from Supabase
    const { error } = await supabase
      .from("bullets")
      .delete()
      .in("id", idsToDelete);

    if (error) {
      toast({
        title: "Error deleting bullet",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Update local state
    const deleteBulletRecursive = (bullets: BulletPoint[]): BulletPoint[] => {
      return bullets.filter((bullet) => {
        if (idsToDelete.includes(bullet.id)) return false;
        bullet.children = deleteBulletRecursive(bullet.children);
        return true;
      });
    };

    setBullets(deleteBulletRecursive(bullets));

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

  return {
    updateBullet,
    deleteBullet,
    toggleCollapse,
  };
};