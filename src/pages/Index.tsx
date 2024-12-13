import TaskManager from "@/components/TaskManager";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

const supabase = createClient(
  "https://your-project-url.supabase.co",
  "your-anon-key"
);

const Index = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-[#F6F6F7]">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#1EAEDB]">BullBook</h1>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="text-[#8A898C] hover:text-[#1EAEDB]"
          >
            Sign out
          </Button>
        </div>
      </nav>
      <TaskManager />
    </div>
  );
};

export default Index;