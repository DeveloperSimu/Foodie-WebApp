import { useState } from "react";
import { useLocation } from "wouter";
import { ShieldCheck, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { loginAdmin } from "@/lib/admin-auth";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (!await loginAdmin(email, password)) {
        toast.error("Invalid admin email or password");
        return;
      }
      setLocation("/admin");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Admin login is unavailable. Please try again.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-muted/30 px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-lg space-y-5">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <ShieldCheck size={30} />
          </div>
          <h1 className="text-3xl font-bold font-serif">Admin Control Center</h1>
          <p className="mt-2 text-sm text-muted-foreground">Only the Foodie superuser can access this panel.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-email">Admin email</Label>
          <Input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-password">Password</Label>
          <Input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </div>
        <Button type="submit" className="w-full"><LogIn className="mr-2 h-4 w-4" /> Admin Login</Button>
      </form>
    </div>
  );
}
