import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChefHat, LogOut, Package, Heart, Store, User as UserIcon, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [saving, setSaving] = useState(false);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <UserIcon size={64} className="mx-auto text-muted-foreground/30 mb-6" />
        <h2 className="text-2xl font-bold mb-4 font-serif">Not Logged In</h2>
        <p className="text-muted-foreground mb-6">Please log in to view your profile.</p>
        <Button asChild><Link href="/login">Log In</Link></Button>
      </div>
    );
  }

  const isCafe = user.role === "cafe";

  const saveProfile = async () => {
    if (name.trim().length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    if (avatarUrl && !/^https?:\/\/\S+$/i.test(avatarUrl) && !avatarUrl.startsWith("data:image/")) {
      toast.error("Enter a valid image URL");
      return;
    }
    setSaving(true);
    const updates = { name: name.trim(), avatarUrl: avatarUrl.trim(), bio: bio.trim() };
    try {
      if (updates.avatarUrl.startsWith("data:image/")) {
        updateUser(updates);
        setEditing(false);
        toast.success("Profile updated locally");
        return;
      }
      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("foodie_token") || ""}`,
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok && response.status < 500) {
        toast.error("Could not save profile");
        return;
      }
      updateUser(updates);
      setEditing(false);
      toast.success("Profile updated");
    } catch {
      updateUser(updates);
      setEditing(false);
      toast.success("Profile updated locally");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold font-serif tracking-tight text-foreground mb-8">Your Profile</h1>
      
      <Card className="border-border/50 overflow-hidden mb-8">
        <div className="h-32 bg-primary/10 relative">
          <div className="absolute -bottom-12 left-6">
            <Avatar className="h-24 w-24 border-4 border-background">
              <AvatarImage src={user.avatarUrl || ""} alt={user.name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        <CardContent className="pt-16 pb-6 px-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold font-serif">{user.name}</h2>
              <p className="text-muted-foreground mb-2">{user.email}</p>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary capitalize">
                {isCafe ? <Store size={12} className="mr-1" /> : <UserIcon size={12} className="mr-1" />}
                {user.role} Account
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing((value) => !value)}>
                <Pencil size={16} className="mr-2" /> Edit Profile
              </Button>
              <Button variant="outline" className="text-destructive hover:bg-destructive/10 border-destructive/20" onClick={() => logout()}>
                <LogOut size={16} className="mr-2" /> Log out
              </Button>
            </div>
          </div>
          {editing && (
            <div className="mt-6 space-y-4 border-t pt-6">
              <div><Label htmlFor="profile-name">Name</Label><Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label htmlFor="profile-image">Profile image URL (optional)</Label><Input id="profile-image" type="url" placeholder="https://example.com/profile.jpg" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} /></div>
              <div className="space-y-2">
                <Label htmlFor="profile-image-file">Or choose an image from your device</Label>
                <Input
                  id="profile-image-file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) {
                      toast.error("Image must be smaller than 2MB");
                      event.target.value = "";
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === "string") setAvatarUrl(reader.result);
                    };
                    reader.onerror = () => toast.error("Could not read this image");
                    reader.readAsDataURL(file);
                  }}
                />
                <p className="text-xs text-muted-foreground">PNG, JPG, WEBP or GIF, up to 2MB. Stored securely in this browser.</p>
              </div>
              <div><Label htmlFor="profile-bio">Bio (optional)</Label><Input id="profile-bio" value={bio} onChange={(e) => setBio(e.target.value)} /></div>
              <Button onClick={saveProfile} disabled={saving}>{saving ? "Saving..." : "Save Profile"}</Button>
            </div>
          )}
          
          {user.bio && (
            <div className="mt-6 p-4 bg-secondary/30 rounded-xl">
              <h3 className="font-semibold text-sm mb-2 text-muted-foreground">About</h3>
              <p className="text-sm">{user.bio}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <h2 className="text-xl font-bold font-serif mb-4">Quick Links</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/orders">
          <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer group h-full">
            <CardHeader className="flex flex-row items-center gap-4 py-4">
              <div className="p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform">
                <Package size={24} />
              </div>
              <div>
                <CardTitle className="text-lg">{isCafe ? "Incoming Orders" : "Order History"}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {isCafe ? "Manage customer orders" : "View your past orders"}
                </p>
              </div>
            </CardHeader>
          </Card>
        </Link>

        {isCafe ? (
          <Link href="/cafe/menu">
            <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer group h-full">
              <CardHeader className="flex flex-row items-center gap-4 py-4">
                <div className="p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform">
                  <ChefHat size={24} />
                </div>
                <div>
                  <CardTitle className="text-lg">My Menu</CardTitle>
                  <p className="text-sm text-muted-foreground">Manage your cafe's dishes</p>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ) : (
          <Link href="/wishlist">
            <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer group h-full">
              <CardHeader className="flex flex-row items-center gap-4 py-4">
                <div className="p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform">
                  <Heart size={24} />
                </div>
                <div>
                  <CardTitle className="text-lg">Wishlist</CardTitle>
                  <p className="text-sm text-muted-foreground">Saved dishes to try later</p>
                </div>
              </CardHeader>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}
