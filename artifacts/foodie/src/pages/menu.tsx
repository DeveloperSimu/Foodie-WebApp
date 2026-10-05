import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useListFoodItems, useAddToWishlist } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChefHat, Star, Store, SlidersHorizontal, Heart } from "lucide-react";
import { DEMO_FOOD_ITEMS, getFoodImage } from "@/lib/demo-foods";
import { getLocalWishlist, toggleLocalWishlist } from "@/lib/local-wishlist";
import { toast } from "sonner";
import { getLocalFoods } from "@/lib/local-foods";
import { useAuth } from "@/lib/auth";

const CATEGORIES = ["All", "Veg", "Non-Veg", "Chinese", "Italian", "Fast Food", "Desserts", "Beverages"];

export default function Menu() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showFilters, setShowFilters] = useState(true);
  const [localWishlist, setLocalWishlist] = useState(() => getLocalWishlist().map((item) => item.id));
  const addToWishlist = useAddToWishlist();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const queryParams = {
    ...(category !== "All" && { category }),
    ...(debouncedSearch && { search: debouncedSearch }),
  };

  const { data: foods, isLoading } = useListFoodItems(queryParams);
  const availableFoods = [
    ...getLocalFoods(),
    ...(Array.isArray(foods) && foods.length > 0 ? foods : DEMO_FOOD_ITEMS),
  ].filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index);
  const foodList = availableFoods.filter((food) => {
    const matchesCategory =
      category === "All" ||
      food.category?.trim().toLowerCase() === category.trim().toLowerCase();
    const matchesSearch =
      !debouncedSearch ||
      food.name.toLowerCase().includes(debouncedSearch.trim().toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-bold font-serif tracking-tight text-foreground mb-2">Explore Menu</h1>
          <p className="text-muted-foreground">Discover delicious dishes from local cafes</p>
        </div>
        
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search dishes..." 
              className="pl-9 bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            className="flex"
            aria-expanded={showFilters}
            onClick={() => {
              setShowFilters((visible) => !visible);
              document.querySelector("[data-menu-categories]")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" /> {showFilters ? "Hide Filters" : "Filters"}
          </Button>
        </div>
      </div>

      {showFilters && (
        <div data-menu-categories className="flex flex-nowrap overflow-x-auto pb-4 mb-6 gap-2 no-scrollbar scroll-smooth" role="group" aria-label="Filter by category">
          {CATEGORIES.map((cat) => (
            <button type="button" key={cat} onClick={() => setCategory(cat)} aria-pressed={category === cat}>
              <Badge
                variant={category === cat ? "default" : "secondary"}
                className="px-4 py-2 text-sm whitespace-nowrap cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {cat}
              </Badge>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-border/50">
              <Skeleton className="h-48 w-full rounded-none" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="pt-2 flex justify-between">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : foodList.length ? (
          foodList.map((food) => (
            <Link key={food.id} href={`/food/${food.id}`}>
              <Card className="overflow-hidden border-border/50 hover:border-primary/50 transition-all hover:shadow-md group cursor-pointer h-full flex flex-col relative">
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
                  {!food.available && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                      <Badge variant="destructive" className="px-3 py-1">Out of Stock</Badge>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge variant="secondary" className="bg-background/90 backdrop-blur font-medium shadow-sm">
                      {food.category}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3 bg-background/90 backdrop-blur px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 shadow-sm">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    {food.rating.toFixed(1)} ({food.reviewCount})
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
                      if (added) {
                        addToWishlist.mutate({ data: { foodItemId: food.id } }, { onError: () => undefined });
                      }
                    }}
                  >
                    <Heart className={localWishlist.includes(food.id) ? "fill-current" : ""} size={17} />
                  </Button>
                </div>
                <CardContent className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors mb-1">{food.name}</h3>
                  <div className="flex items-center text-xs text-muted-foreground mb-3">
                    <Store size={14} className="mr-1" />
                    <span className="truncate">{food.cafeName}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{food.description}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                    <span className="font-bold text-xl text-foreground">${food.price.toFixed(2)}</span>
                    <Button 
                      size="sm" 
                      disabled={!food.available} 
                      className="rounded-full px-4"
                    >
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <div className="bg-muted p-6 rounded-full mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold font-serif mb-2">No dishes found</h3>
            <p className="text-muted-foreground max-w-md">
              We couldn't find any dishes matching your current filters. Try a different category or search term.
            </p>
            {(search || category !== "All") && (
              <Button 
                variant="outline" 
                className="mt-6"
                onClick={() => {
                  setSearch("");
                  setDebouncedSearch("");
                  setCategory("All");
                }}
              >
                Clear all filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
