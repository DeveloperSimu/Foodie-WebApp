import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { createLocalAuth, getAuthErrorMessage, useAuth } from "@/lib/auth";
import { useRegister, RegisterBodyRole } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChefHat, Loader2, Store, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["user", "cafe"] as const),
  avatarUrl: z.string().url("Enter a valid image URL").optional().or(z.literal("")),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data) => {
        login(data.token, data.user);
      },
      onError: (err: unknown) => {
        if (getAuthErrorMessage(err, "").includes("unavailable")) {
          const values = form.getValues();
          const localAuth = createLocalAuth(
            values.name.trim(),
            values.email.trim().toLowerCase(),
            values.password,
            values.role,
            values.avatarUrl || undefined,
          );
          login(localAuth.token, localAuth.user);
          return;
        }
        setError(getAuthErrorMessage(err, "Registration failed. Please try again."));
      }
    }
  });

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "user",
    },
  });

  const onSubmit = (data: RegisterFormValues) => {
    setError(null);
    registerMutation.mutate({ 
      data: {
        ...data,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        avatarUrl: data.avatarUrl || undefined,
        role: data.role as RegisterBodyRole
      } 
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-secondary/30">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-2">
            <ChefHat size={32} className="text-primary" />
          </div>
          <CardTitle className="text-3xl font-serif">Join Foodie</CardTitle>
          <CardDescription className="text-base">
            Create an account to start ordering or selling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-sm text-center font-medium">
                  {error}
                </div>
              )}
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>I want to...</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-2 gap-4"
                      >
                        <FormItem>
                          <FormLabel className="[&:has([data-state=checked])>div]:border-primary [&:has([data-state=checked])>div]:bg-primary/5 cursor-pointer">
                            <FormControl>
                              <RadioGroupItem value="user" className="sr-only" />
                            </FormControl>
                            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-muted p-4 hover:bg-accent/5 transition-colors">
                              <User className="h-6 w-6" />
                              <span className="font-semibold text-sm">Order Food</span>
                            </div>
                          </FormLabel>
                        </FormItem>
                        <FormItem>
                          <FormLabel className="[&:has([data-state=checked])>div]:border-primary [&:has([data-state=checked])>div]:bg-primary/5 cursor-pointer">
                            <FormControl>
                              <RadioGroupItem value="cafe" className="sr-only" />
                            </FormControl>
                            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-muted p-4 hover:bg-accent/5 transition-colors">
                              <Store className="h-6 w-6" />
                              <span className="font-semibold text-sm">Sell Food</span>
                            </div>
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile image URL <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/profile.jpg" type="url" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name {form.watch("role") === "cafe" ? "(or Cafe Name)" : ""}</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input placeholder="••••••••" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full h-12 text-base mt-2" 
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </Form>
          
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
