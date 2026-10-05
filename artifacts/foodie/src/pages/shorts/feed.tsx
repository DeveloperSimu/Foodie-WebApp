import { Link } from "wouter";
import { useListShorts } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Video, Play, Plus, Eye } from "lucide-react";
import { DEMO_SHORTS } from "@/lib/demo-foods";
import { getLocalShorts } from "@/lib/local-shorts";

export default function ShortsFeed() {
  const { user } = useAuth();
  const { data: shorts, isLoading } = useListShorts();
  const apiShorts = Array.isArray(shorts) ? shorts : [];
  const shortList = [...getLocalShorts(), ...(apiShorts.length > 0 ? apiShorts : DEMO_SHORTS)];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-serif tracking-tight text-foreground mb-2">
            Cooking Shorts
          </h1>
          <p className="text-muted-foreground">Watch quick culinary moments and techniques</p>
        </div>

        {user && (
          <Button asChild>
            <Link href="/shorts/new">
              <Plus className="mr-2 h-4 w-4" /> Upload Short
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[9/16] rounded-xl overflow-hidden relative">
              <Skeleton className="w-full h-full" />
            </div>
          ))
        ) : shortList.length ? (
          shortList.map((short) => (
            <Link key={short.id} href={`/shorts/${short.id}`}>
              <div className="aspect-[9/16] rounded-xl overflow-hidden relative group cursor-pointer bg-black">
                {short.thumbnailUrl ? (
                  <img
                    src={short.thumbnailUrl}
                    alt={short.title}
                    className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-secondary flex items-center justify-center">
                    <Video size={40} className="text-muted-foreground/30" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-primary/90 backdrop-blur shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110">
                    <Play size={24} className="text-primary-foreground fill-primary-foreground ml-1" />
                  </div>

                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-white/90 text-xs font-medium bg-black/40 backdrop-blur px-2 py-1 rounded-md">
                      <Eye size={12} /> {short.views}
                    </div>
                  </div>

                  <h3 className="text-white font-medium line-clamp-2 text-sm md:text-base leading-tight mb-2 drop-shadow-md">
                    {short.title}
                  </h3>

                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white border border-white/20">
                      {short.authorName.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-white/80 text-xs truncate">@{short.authorName}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-card rounded-2xl border border-dashed border-border flex flex-col items-center">
            <Video size={48} className="text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold mb-2">No shorts available</h3>
            <p className="text-muted-foreground mb-6">Check back later for new culinary videos!</p>
            {user && (
              <Button asChild>
                <Link href="/shorts/new">Upload the first short</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
