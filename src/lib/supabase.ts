import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pxmthjryoxoifxdtcevd.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4bXRoanJ5b3hvaWZ4ZHRjZXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwOTMzMjMsImV4cCI6MjA0OTY2OTMyM30.OdgyZdhqnNL-dt0eKkCLK0Z4ChqQ0y7O07nGcR_w474";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);