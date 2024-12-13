import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error("Missing VITE_SUPABASE_URL environment variable");
  console.log("Please make sure you have connected your Supabase project in the Lovable interface");
  throw new Error("Missing VITE_SUPABASE_URL - Please connect your Supabase project");
}

if (!supabaseAnonKey) {
  console.error("Missing VITE_SUPABASE_ANON_KEY environment variable");
  console.log("Please make sure you have connected your Supabase project in the Lovable interface");
  throw new Error("Missing VITE_SUPABASE_ANON_KEY - Please connect your Supabase project");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);