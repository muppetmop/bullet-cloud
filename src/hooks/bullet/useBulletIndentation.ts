import { BulletPoint } from "@/types/bullet";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { findBulletAndParent } from "@/utils/bulletOperations";

export const useBulletIndentation = (
  bullets: BulletPoint[],
  setBullets: (bullets: BulletPoint[]) => void
) => {
  const { toast } = useToast();

  const indentBullet = async (id: string) => {
    const [bullet, parent] = findBulletAndParent(id, bullets);
    if (!bullet || !parent) return;

    const index = parent.indexOf(bullet);
    if (index === 0) return;

    const previousBullet = parent[index - 1];
    parent.splice(index, 1);
    previousBullet.children.push(bullet);
    setBullets([...bullets]);

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

    const { error } = await supabase
      .from("bullets")
      .update({ parent_id: grandParent === bullets ? null : grandParent[0]?.id })
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
    indentBullet,
    outdentBullet,
  };
};