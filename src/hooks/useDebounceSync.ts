import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import debounce from "lodash/debounce";

export const useDebounceSync = () => {
  const saveBulletToSupabase = useCallback(
    debounce(async (id: string, content: string) => {
      try {
        const { error } = await supabase
          .from("bullets")
          .update({ content, updated_at: new Date().toISOString() })
          .eq("id", id);

        if (error) {
          console.error("Error saving bullet:", error);
        }
      } catch (error) {
        console.error("Error in saveBulletToSupabase:", error);
      }
    }, 1000),
    []
  );

  return { saveBulletToSupabase };
};