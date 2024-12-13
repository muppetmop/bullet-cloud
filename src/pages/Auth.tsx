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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 p-8 bg-white border rounded-lg shadow-lg">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Welcome to BullBook</h2>
          <p className="text-base text-muted-foreground">Your personal bullet journal</p>
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
                padding: '10px 15px',
                height: '42px',
              },
              input: {
                borderRadius: 'var(--radius)',
                padding: '10px 15px',
              },
              anchor: {
                color: 'rgb(var(--primary))',
              },
              container: {
                gap: '16px',
              },
              divider: {
                margin: '24px 0',
              },
              message: {
                padding: '10px',
                borderRadius: 'var(--radius)',
                marginBottom: '16px',
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