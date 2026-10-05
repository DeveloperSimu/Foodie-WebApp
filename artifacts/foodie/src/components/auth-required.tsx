import type { ReactNode } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function AuthRequired({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Checking your account...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Login Required</h2>
        <p className="mb-6 text-muted-foreground">Create an account or log in to use this feature.</p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" asChild><Link href="/login">Log in</Link></Button>
          <Button asChild><Link href="/register">Sign up</Link></Button>
        </div>
      </div>
    );
  }

  return children;
}
