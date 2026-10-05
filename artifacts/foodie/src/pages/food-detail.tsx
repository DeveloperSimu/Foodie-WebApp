import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import {
  useGetFoodItem, useAddToWishlist, useRemoveFromWishlist,
  useGetWishlist, getGetWishlistQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ChefHat, ArrowLeft, Star, Clock, Store, Heart, Minus, Plus, ShoppingBag } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { DEMO_FOOD_ITEMS, getFoodImage } from "@/lib/demo-foods";
import { getLocalFoods } from "@/lib/local-foods";
import { getLocalWishlist, toggleLocalWishlist } from "@/lib/local-wishlist";

export default function FoodDetail() {
  const { id } = useParams<{ id: string }>();
  const foodId = parseInt(id, 10);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [quantity, setQuantity] = useState(1);
  const [localWishlist, setLocalWishlist] = useState(() => getLocalWishlist().some((item) => item.id === foodId));
  const queryClient = useQueryClient();

  const { data: food, isLoading, isError } = useGetFoodItem(foodId, {
    query: { enabled: !!foodId }
  });
  const selectedFood = food ?? getLocalFoods().find((item) => item.id === foodId) ?? DEMO_FOOD_ITEMS.find((item) => item.id === foodId);

  const { data: wishlist } = useGetWishlist({
    query: { enabled: !!user && user.role === "user" }
  });

  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const isWishlisted = localWishlist || (wishlist?.some(item => item.foodItemId === foodId) ?? false);
  const wishlistItemId = wishlist?.find(item => item.foodItemId === foodId)?.id;

  const handleWishlistToggle = () => {
    if (!selectedFood) {
      return;
    }
    if (!user) {
      toast.error("Please log in to save dishes to your wishlist");
      setLocation("/login");
      return;
    }
    if (user && user.role !== "user") {
      toast.error("Only regular users can save to wishlist");
      return;
    }
    const added = toggleLocalWishlist(selectedFood);
    setLocalWishlist(added);
    if (!added && wishlistItemId && user) {
      removeFromWishlist.mutate({ id: wishlistItemId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
        },
      });
    } else if (added && user) {
      addToWishlist.mutate({ data: { foodItemId: foodId } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
        },
      });
    }
    toast.success(added ? "Added to wishlist ❤️" : "Removed from wishlist");
  };

  const handleOrderNow = () => {
    if (!user) {
      toast.error("Please login to place an order");
      setLocation("/login");
      return;
    }
    if (user.role !== "user") {
      toast.error("Only regular users can place orders");
      return;
    }
    setLocation(`/checkout?foodId=${foodId}&qty=${quantity}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Skeleton className="h-10 w-24 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!selectedFood) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Food item not found</h2>
        <Button asChild><Link href="/menu">Back to Menu</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Button variant="ghost" asChild className="mb-6 -ml-4 text-muted-foreground hover:text-foreground">
        <Link href="/menu">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to menu
        </Link>
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        <div className="relative group rounded-2xl overflow-hidden bg-muted aspect-[4/3] md:aspect-square flex items-center justify-center">
          {getFoodImage(selectedFood) ? (
            <img src={getFoodImage(selectedFood) ?? undefined} alt={selectedFood.name} className="w-full h-full object-cover" />
          ) : (
            <ChefHat size={80} className="text-muted-foreground/20" />
          )}
          <Button
            variant="secondary"
            size="icon"
            className={`absolute top-4 right-4 rounded-full h-12 w-12 shadow-md transition-all ${isWishlisted ? 'text-destructive bg-destructive/10 hover:bg-destructive/20' : 'text-muted-foreground hover:text-foreground bg-background/80 hover:bg-background'}`}
            onClick={handleWishlistToggle}
          >
            <Heart className={`h-6 w-6 ${isWishlisted ? 'fill-current' : ''}`} />
          </Button>
          {!selectedFood.available && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
              <Badge variant="destructive" className="text-lg px-6 py-2 shadow-lg">Out of Stock</Badge>
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="px-3 py-1 font-medium">{selectedFood.category}</Badge>
            <div className="flex items-center text-sm font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-1 rounded-md">
              <Star size={14} className="mr-1 fill-current" />
              {selectedFood.rating.toFixed(1)} ({selectedFood.reviewCount} reviews)
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold font-serif tracking-tight text-foreground mb-4">{selectedFood.name}</h1>

          <div className="flex items-center text-muted-foreground mb-6 text-lg">
            <Store size={20} className="mr-2" />
            <span className="font-medium">{selectedFood.cafeName}</span>
          </div>

          <div className="text-3xl font-bold text-primary mb-6">${selectedFood.price.toFixed(2)}</div>

          <p className="text-muted-foreground text-lg leading-relaxed mb-8">{selectedFood.description}</p>

          <Separator className="mb-8" />

          {selectedFood.available ? (
            <div className="space-y-6 mt-auto">
              <div className="flex items-center gap-4">
                <span className="font-medium text-foreground">Quantity</span>
                <div className="flex items-center border border-border rounded-full p-1 bg-background">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>
                    <Minus size={16} />
                  </Button>
                  <span className="w-12 text-center font-medium text-lg">{quantity}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setQuantity(quantity + 1)}>
                    <Plus size={16} />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
                <span className="text-muted-foreground font-medium">Total</span>
                <span className="text-2xl font-bold text-foreground">${(selectedFood.price * quantity).toFixed(2)}</span>
              </div>

              <Button
                size="lg"
                className="w-full h-14 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
                onClick={handleOrderNow}
              >
                <ShoppingBag className="mr-2 h-5 w-5" /> Proceed to Checkout
              </Button>

              <p className="text-center text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
                <Clock size={12} /> Estimated preparation time: 20–35 mins
              </p>
            </div>
          ) : (
            <div className="p-6 bg-secondary/30 border border-border rounded-xl text-center mt-auto">
              <h3 className="font-bold text-lg mb-2">Currently Unavailable</h3>
              <p className="text-muted-foreground mb-4">This item is out of stock. Add it to your wishlist to order later.</p>
              <Button variant="outline" className="w-full" onClick={handleWishlistToggle}>
                {isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
