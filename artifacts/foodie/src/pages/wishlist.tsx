import { Link } from "wouter";
import { useGetWishlist, useRemoveFromWishlist, getGetWishlistQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Trash2, ArrowRight, ChefHat, Store, Star } from "lucide-react";
import { toast } from "sonner";
import { getLocalWishlist, toggleLocalWishlist } from "@/lib/local-wishlist";

export default function Wishlist() {
  const queryClient = useQueryClient();
  const { data: wishlist, isLoading } = useGetWishlist();
  const apiWishlistItems = Array.isArray(wishlist) ? wishlist : [];
  const localItems = getLocalWishlist();
  const wishlistItems = apiWishlistItems.length
    ? apiWishlistItems
    : localItems.map((foodItem) => ({
        id: foodItem.id,
        userId: 0,
        foodItemId: foodItem.id,
        foodItem,
        createdAt: new Date().toISOString(),
      }));
  const removeMutation = useRemoveFromWishlist();

  const handleRemove = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    const localItem = localItems.find((item) => item.id === id);
    if (localItem) {
      toggleLocalWishlist(localItem);
      queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
      toast.success("Item removed from wishlist");
      return;
    }
    removeMutation.mutate({ id }, {
      onSuccess: () => {
        toast.success("Item removed from wishlist");
        queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-destructive/10 text-destructive rounded-full">
          <Heart size={24} className="fill-current" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight text-foreground">Your Wishlist</h1>
          <p className="text-muted-foreground">Dishes you've saved for later</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-border/50">
              <Skeleton className="h-48 w-full rounded-none" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="pt-2 flex justify-between">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : wishlistItems.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            <Link key={item.id} href={`/food/${item.foodItemId}`}>
              <Card className="overflow-hidden border-border/50 hover:border-primary/50 transition-all hover:shadow-md group cursor-pointer h-full flex flex-col relative">
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  onClick={(e) => handleRemove(e, item.id)}
                  disabled={removeMutation.isPending}
                >
                  <Trash2 size={14} />
                </Button>

                <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                  {item.foodItem.imageUrl ? (
                    <img
                      src={item.foodItem.imageUrl}
                      alt={item.foodItem.name}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ChefHat size={48} className="opacity-20" />
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 shadow-sm">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    {item.foodItem.rating.toFixed(1)}
                  </div>
                </div>

                <CardContent className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors mb-1">
                    {item.foodItem.name}
                  </h3>
                  <div className="flex items-center text-xs text-muted-foreground mb-3">
                    <Store size={14} className="mr-1" />
                    <span className="truncate">{item.foodItem.cafeName}</span>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                    <span className="font-bold text-lg text-foreground">
                      ${item.foodItem.price.toFixed(2)}
                    </span>
                    <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:underline">
                      Order <ArrowRight size={14} />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center flex flex-col items-center justify-center bg-card rounded-xl border border-dashed border-border">
          <div className="p-6 bg-secondary/50 rounded-full mb-6">
            <Heart size={48} className="text-muted-foreground/30" />
          </div>
          <h2 className="text-2xl font-bold font-serif mb-2">Your wishlist is empty</h2>
          <p className="text-muted-foreground max-w-sm mb-6">
            Keep track of dishes you want to try later by adding them to your wishlist.
          </p>
          <Button asChild>
            <Link href="/menu">Explore Menu</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
