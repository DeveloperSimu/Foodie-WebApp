import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChefHat, Heart, Home, LogOut, Menu as MenuIcon, Package, User, Video, Lightbulb, UserCircle } from "lucide-react";
import { ReactNode } from "react";
import { useEffect } from "react";
import { Footer } from "@/components/footer";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const isCafe = user?.role === "cafe";

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/menu", label: "Menu", icon: MenuIcon },
    { href: "/shorts", label: "Shorts", icon: Video },
    { href: "/ideas", label: "Ideas", icon: Lightbulb },
  ];

  const userItems = [
    { href: "/orders", label: "My Orders", icon: Package },
    { href: "/wishlist", label: "Wishlist", icon: Heart },
  ];

  const cafeItems = [
    { href: "/orders", label: "Incoming Orders", icon: Package },
    { href: "/cafe/menu", label: "My Menu", icon: ChefHat },
  ];

  const links = [...navItems, ...(user ? (isCafe ? cafeItems : userItems) : [])];

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary text-primary-foreground p-2 rounded-xl group-hover:rotate-12 transition-transform">
              <ChefHat size={24} />
            </div>
            <span className="text-xl font-bold font-serif tracking-tight text-primary">Foodie</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon size={16} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-border">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatarUrl || ""} alt={user.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-primary font-medium capitalize mt-1">{user.role} Account</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer w-full flex items-center">
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild className="hidden sm:flex">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur pb-safe">
        <nav className="flex justify-around items-center h-16 px-2">
          {links.slice(0, 5).map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 text-xs ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium truncate w-full text-center px-1">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <main className="flex-1 w-full pb-20 md:pb-0">
        {children}
      </main>

      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
