import TaskManager from "@/components/TaskManager";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

const supabase = createClient(
  "https://pxmthjryoxoifxdtcevd.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4bXRoanJ5b3hvaWZ4ZHRjZXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwOTMzMjMsImV4cCI6MjA0OTY2OTMyM30.OdgyZdhqnNL-dt0eKkCLK0Z4ChqQ0y7O07nGcR_w474"
);

const Index = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black">BullBook</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-[#8A898C] hover:text-[#1EAEDB] flex items-center gap-2"
              >
                {userEmail || 'Loading...'}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSignOut}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
      <TaskManager />
    </div>
  );
};

export default Index;