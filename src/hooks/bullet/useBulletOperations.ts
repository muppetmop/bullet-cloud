import { BulletPoint } from "@/types/bullet";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { findBulletAndParent } from "@/utils/bulletOperations";

export const useBulletOperations = (
  bullets: BulletPoint[],
  setBullets: (bullets: BulletPoint[]) => void
) => {
  const { user } = useAuth();
  const { toast } = useToast();

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

  return {
    createNewBullet,
    createNewRootBullet,
  };
};