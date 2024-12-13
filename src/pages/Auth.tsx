import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Welcome to BullBook</h2>
          <p className="text-muted-foreground">Sign in or create an account</p>
        </div>
        <SupabaseAuth 
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            style: {
              button: {
                background: 'rgb(var(--primary))',
                color: 'rgb(var(--primary-foreground))',
                borderRadius: 'var(--radius)',
              },
              input: {
                borderRadius: 'var(--radius)',
              },
            },
          }}
          providers={[]}
        />
      </div>
    </div>
  );
};

export default Auth;