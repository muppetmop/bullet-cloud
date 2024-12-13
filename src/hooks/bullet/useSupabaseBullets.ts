import { useState, useEffect } from "react";
import { BulletPoint } from "@/types/bullet";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const useSupabaseBullets = () => {
  const [bullets, setBullets] = useState<BulletPoint[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

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

  return { bullets, setBullets };
};