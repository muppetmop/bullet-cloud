import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { BulletPoint } from "@/types/bullet";

interface UserWithBullets {
  id: string;
  nom_de_plume: string;
  bullets: BulletPoint[];
}

export const useUsersAndBullets = () => {
  const [users, setUsers] = useState<UserWithBullets[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsersAndBullets = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Fetch bullets for each user
      const usersWithBullets = await Promise.all(
        profiles.map(async (profile) => {
          const { data: bullets, error: bulletsError } = await supabase
            .from('bullets')
            .select('*')
            .eq('user_id', profile.id)
            .order('position');

          if (bulletsError) throw bulletsError;

          // Convert flat structure to hierarchical
          const bulletMap = new Map<string, BulletPoint>();
          const rootBullets: BulletPoint[] = [];
          
          bullets.forEach(bullet => {
            bulletMap.set(bullet.id, {
              ...bullet,
              children: [],
              isCollapsed: bullet.is_collapsed
            });
          });
          
          bullets.forEach(bullet => {
            const bulletPoint = bulletMap.get(bullet.id)!;
            if (bullet.parent_id) {
              const parent = bulletMap.get(bullet.parent_id);
              if (parent) {
                parent.children.push(bulletPoint);
              }
            } else {
              rootBullets.push(bulletPoint);
            }
          });

          return {
            id: profile.id,
            nom_de_plume: profile.nom_de_plume,
            bullets: rootBullets
          };
        })
      );

      setUsers(usersWithBullets);
    } catch (err) {
      console.error('Error fetching users and bullets:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndBullets();
  }, []);

  return { users, loading, error, refetch: fetchUsersAndBullets };
};