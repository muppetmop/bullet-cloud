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
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";

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
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1">
          <nav className="bg-white shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <h1 className="text-xl sm:text-2xl font-bold text-black">BullBook</h1>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-[#8A898C] hover:text-[#1EAEDB] flex items-center gap-2 text-sm sm:text-base truncate max-w-[200px]"
                  >
                    <span className="truncate">{userEmail || 'Loading...'}</span>
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuItem onClick={handleSignOut}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </nav>
          <TaskManager />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;