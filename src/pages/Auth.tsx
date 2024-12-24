import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nomDePlume, setNomDePlume] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // First check if user exists
        const { data: existingUser } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (existingUser.user) {
          toast({
            title: "Account exists",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive",
          });
          setIsSignUp(false);
          setIsLoading(false);
          return;
        }

        // If user doesn't exist, proceed with signup
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nom_de_plume: nomDePlume,
            },
            emailRedirectTo: window.location.origin,
          },
        });
        
        if (signUpError) throw signUpError;

        toast({
          title: "Success!",
          description: "Please check your email to verify your account.",
        });
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) {
          if (signInError.message.includes("Email not confirmed")) {
            throw new Error("Please verify your email before signing in. Check your inbox for the verification link.");
          }
          if (signInError.message.includes("Invalid login credentials")) {
            throw new Error("Invalid email or password. If you haven't registered yet, please sign up first.");
          }
          throw signInError;
        }
        
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg border border-gray-200">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-black mb-2">BullBook</h1>
          <p className="text-gray-500">
            {isSignUp ? "Create your account" : "Welcome back"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-4">
            {isSignUp && (
              <>
                <Input
                  type="text"
                  placeholder="Nom de Plume"
                  value={nomDePlume}
                  onChange={(e) => setNomDePlume(e.target.value)}
                  required
                  className="w-full bg-white border-gray-200 focus-visible:ring-gray-500"
                  disabled={isLoading}
                  minLength={2}
                  maxLength={50}
                />
                <div className="h-2" />
                <div className="border-t border-gray-100" />
                <div className="h-2" />
              </>
            )}
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white border-gray-200 focus-visible:ring-gray-500"
              disabled={isLoading}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white border-gray-200 focus-visible:ring-gray-500"
              disabled={isLoading}
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-black hover:bg-gray-800 text-white transition-colors"
            disabled={isLoading}
          >
            {isLoading
              ? "Loading..."
              : isSignUp
              ? "Create account"
              : "Sign in"}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-gray-600 hover:text-black transition-colors"
              disabled={isLoading}
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Need an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;