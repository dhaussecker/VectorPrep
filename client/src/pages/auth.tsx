import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GraduationCap, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { loginSchema, registerSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import type { z } from "zod";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", password: "", displayName: "" },
  });

  const handleLogin = async (data: z.infer<typeof loginSchema>) => {
    setIsPending(true);
    try {
      await login(data.username, data.password);
    } catch (e: any) {
      toast({ title: "Login failed", description: e.message, variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  const handleRegister = async (data: z.infer<typeof registerSchema>) => {
    setIsPending(true);
    try {
      await register(data.username, data.password, data.displayName);
    } catch (e: any) {
      toast({ title: "Registration failed", description: e.message, variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10 pointer-events-none" />
      <div className="relative w-full max-w-[900px] grid md:grid-cols-2 gap-6 items-center">
        <div className="hidden md:flex flex-col gap-6 p-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-md bg-primary">
              <GraduationCap className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">PrepEngine</h1>
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Master your first-year engineering courses with interactive learn cards and adaptive practice questions.
          </p>
          <div className="space-y-4 mt-4">
            <FeaturePill label="Interactive Learn Cards" />
            <FeaturePill label="Adaptive Practice Mode" />
            <FeaturePill label="Track Your Progress" />
            <FeaturePill label="Regenerate Similar Questions" />
          </div>
        </div>

        <Card className="w-full">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center gap-2 md:hidden mb-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">PrepEngine</span>
            </div>
            <CardTitle className="text-xl">{isLogin ? "Welcome back" : "Create account"}</CardTitle>
            <CardDescription>
              {isLogin ? "Sign in to continue your study session" : "Get started with your engineering prep"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLogin ? (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your username" data-testid="input-username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter your password" data-testid="input-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isPending} data-testid="button-login">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Sign In
                  </Button>
                </form>
              </Form>
            ) : (
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" data-testid="input-display-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="johndoe" data-testid="input-reg-username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Min 6 characters" data-testid="input-reg-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isPending} data-testid="button-register">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Create Account
                  </Button>
                </form>
              </Form>
            )}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-toggle-auth"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FeaturePill({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
