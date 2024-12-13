import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import debounce from "lodash/debounce";
import { toast } from "sonner";

export const useDebounceSync = () => {
  const saveBulletToSupabase = useCallback(
    debounce(async (id: string, content: string) => {
      try {
        const session = await supabase.auth.getSession();
        if (!session.data.session?.user.id) {
          console.error("No user ID found");
          return;
        }

        const { error } = await supabase
          .from("bullets")
          .update({ 
            content, 
            updated_at: new Date().toISOString()
          })
          .eq("id", id)
          .eq("user_id", session.data.session.user.id);

        if (error) {
          console.error("Error saving bullet:", error);
          toast.error("Failed to save changes");
        } else {
          console.log("Bullet saved successfully");
        }
      } catch (error) {
        console.error("Error in saveBulletToSupabase:", error);
        toast.error("Failed to save changes");
      }
    }, 100),
    []
  );

  return { saveBulletToSupabase };
};