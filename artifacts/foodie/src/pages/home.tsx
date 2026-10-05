import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetTrendingFoodItems, useGetStatsOverview, useListShorts } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChefHat, TrendingUp, Star, Users, Store, Play, Video, Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DEMO_FOOD_ITEMS, DEMO_SHORTS, getFoodImage } from "@/lib/demo-foods";
import { getLocalWishlist, toggleLocalWishlist } from "@/lib/local-wishlist";
import { toast } from "sonner";
import { getLocalShorts } from "@/lib/local-shorts";
import { getLocalFoods } from "@/lib/local-foods";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [localWishlist, setLocalWishlist] = useState(() => getLocalWishlist().map((item) => item.id));
  const trendingResponse = useGetTrendingFoodItems();
  const statsResponse = useGetStatsOverview();
  const shortsResponse = useListShorts();

  const apiTrending = Array.isArray(trendingResponse.data) ? trendingResponse.data : [];
  const trending = [...getLocalFoods(), ...(apiTrending.length > 0 ? apiTrending : DEMO_FOOD_ITEMS)]
    .filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index);
  const apiShorts = Array.isArray(shortsResponse.data) ? shortsResponse.data : [];
  const shorts = [...getLocalShorts(), ...(apiShorts.length > 0 ? apiShorts : DEMO_SHORTS)];
  const stats = statsResponse.data ?? null;
  const fallbackStats = {
    totalCafes: new Set([...DEMO_FOOD_ITEMS, ...getLocalFoods()].map((food) => food.cafeId)).size,
    totalFoodItems: DEMO_FOOD_ITEMS.length + getLocalFoods().length,
    totalUsers: 250,
    totalOrders: 120,
  };
  const displayStats = {
    totalCafes: stats?.totalCafes || fallbackStats.totalCafes,
    totalFoodItems: stats?.totalFoodItems || fallbackStats.totalFoodItems,
    totalUsers: stats?.totalUsers || fallbackStats.totalUsers,
    totalOrders: stats?.totalOrders || fallbackStats.totalOrders,
  };

  const isLoadingTrending = trendingResponse?.isLoading;
  const isLoadingStats = statsResponse?.isLoading;
  const isLoadingShorts = shortsResponse?.isLoading;
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[600px] lg:min-h-[700px] overflow-hidden flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&q=85"
            alt="Premium food spread"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        <div className="container mx-auto px-4 relative z-10 py-24">
          <div className="max-w-2xl space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur text-white text-sm font-medium border border-white/20">
              <ChefHat size={16} />
              <span>Discover Culinary Magic</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold font-serif tracking-tight text-white leading-tight">
              Craving something{" "}
              <span className="text-primary italic">extraordinary?</span>
            </h1>
            <p className="text-xl text-white/80 max-w-lg leading-relaxed">
              Explore trending dishes from local cafes, watch cooking shorts, and share your passion for food in a vibrant culinary community.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4 pt-2">
              <Button size="lg" asChild className="rounded-full text-base px-8 h-14 shadow-lg shadow-primary/30">
                <Link href="/menu">Order Food Now</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-full text-base px-8 h-14 border-2 border-white/40 text-white hover:bg-white/10 hover:text-white">
                <Link href="/shorts">Watch Shorts</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {isLoadingStats ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))
            ) : (
              <>
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-3 bg-primary/10 rounded-full text-primary mb-2">
                    <Store size={24} />
                  </div>
                  <h3 className="text-3xl font-bold font-serif">{displayStats.totalCafes}+</h3>
                  <p className="text-muted-foreground text-sm font-medium">Local Cafes</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-3 bg-primary/10 rounded-full text-primary mb-2">
                    <ChefHat size={24} />
                  </div>
                  <h3 className="text-3xl font-bold font-serif">{displayStats.totalFoodItems}+</h3>
                  <p className="text-muted-foreground text-sm font-medium">Dishes Available</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-3 bg-primary/10 rounded-full text-primary mb-2">
                    <Users size={24} />
                  </div>
                  <h3 className="text-3xl font-bold font-serif">{displayStats.totalUsers}+</h3>
                  <p className="text-muted-foreground text-sm font-medium">Food Lovers</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-3 bg-primary/10 rounded-full text-primary mb-2">
                    <TrendingUp size={24} />
                  </div>
                  <h3 className="text-3xl font-bold font-serif">{displayStats.totalOrders}+</h3>
                  <p className="text-muted-foreground text-sm font-medium">Orders Delivered</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Trending Food */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-serif tracking-tight mb-2">Trending Now</h2>
              <p className="text-muted-foreground">The most loved dishes this week</p>
            </div>
            <Button variant="ghost" asChild className="hidden sm:flex text-primary hover:text-primary hover:bg-primary/10">
              <Link href="/menu">View Full Menu &rarr;</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoadingTrending ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="overflow-hidden border-border/50">
                  <Skeleton className="h-48 w-full rounded-none" />
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="pt-2 flex justify-between">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : Array.isArray(trending) && trending.length ? (
              trending.slice(0, 4).map((food) => (
                <Link key={food.id} href={`/food/${food.id}`}>
                  <Card className="overflow-hidden border-border/50 hover:border-primary/50 transition-colors group cursor-pointer h-full flex flex-col relative">
                    <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                      {getFoodImage(food) ? (
                        <img
                          src={getFoodImage(food) ?? undefined}
                          alt={food.name}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <ChefHat size={48} className="opacity-20" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-background/90 backdrop-blur px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 shadow-sm">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        {food.rating.toFixed(1)}
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        aria-label={localWishlist.includes(food.id) ? `Remove ${food.name} from wishlist` : `Add ${food.name} to wishlist`}
                        className={`absolute top-12 right-3 z-10 h-9 w-9 rounded-full shadow-md ${localWishlist.includes(food.id) ? "text-destructive" : ""}`}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          if (!user) {
                            setLocation("/login");
                            return;
                          }
                          const added = toggleLocalWishlist(food);
                          setLocalWishlist(getLocalWishlist().map((item) => item.id));
                          toast.success(added ? "Added to wishlist" : "Removed from wishlist");
                        }}
                      >
                        <Heart className={localWishlist.includes(food.id) ? "fill-current" : ""} size={17} />
                      </Button>
                    </div>
                    <CardContent className="p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">{food.name}</h3>
                        <span className="font-bold text-primary ml-2 flex-shrink-0">${food.price.toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{food.description}</p>
                      <div className="flex items-center text-xs text-muted-foreground pt-4 border-t border-border">
                        <Store size={14} className="mr-1" />
                        <span className="truncate">{food.cafeName}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-xl">
                No trending items right now. Check back later!
              </div>
            )}
          </div>

          <Button variant="outline" asChild className="w-full mt-8 sm:hidden">
            <Link href="/menu">View Full Menu</Link>
          </Button>
        </div>
      </section>

      {/* Featured Shorts */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-serif tracking-tight mb-2">Cooking Shorts</h2>
              <p className="text-muted-foreground">Quick bites of culinary inspiration</p>
            </div>
            <Button variant="ghost" asChild className="hidden sm:flex text-primary hover:text-primary hover:bg-primary/10">
              <Link href="/shorts">Watch All &rarr;</Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {isLoadingShorts ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[9/16] rounded-xl overflow-hidden relative">
                  <Skeleton className="w-full h-full" />
                </div>
              ))
            ) : shorts?.length ? (
              shorts.slice(0, 4).map((short) => (
                <Link key={short.id} href={`/shorts/${short.id}`}>
                  <div className="aspect-[9/16] rounded-xl overflow-hidden relative group cursor-pointer bg-black">
                    {short.thumbnailUrl ? (
                      <img
                        src={short.thumbnailUrl}
                        alt={short.title}
                        className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Video size={32} className="text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-110">
                        <Play size={20} className="text-white fill-white ml-1" />
                      </div>
                      <h3 className="text-white font-medium line-clamp-2 text-sm md:text-base leading-tight mb-1">{short.title}</h3>
                      <p className="text-white/70 text-xs truncate">@{short.authorName}</p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-xl">
                No shorts available yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
