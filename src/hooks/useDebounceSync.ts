import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import debounce from "lodash/debounce";

export const useDebounceSync = () => {
  const saveBulletToSupabase = useCallback(
    debounce(async (id: string, content: string) => {
      try {
        const session = await supabase.auth.getSession();
        if (!session.data.session?.user.id) {
          console.error("No user ID found");
          return;
        }

        const { data, error } = await supabase
          .from("bullets")
          .update({ 
            content, 
            updated_at: new Date().toISOString(),
            user_id: session.data.session.user.id 
          })
          .eq("id", id)
          .select();

        if (error) {
          console.error("Error saving bullet:", error);
        } else {
          console.log("Bullet saved successfully:", data);
        }
      } catch (error) {
        console.error("Error in saveBulletToSupabase:", error);
      }
    }, 100),
    []
  );

  return { saveBulletToSupabase };
};