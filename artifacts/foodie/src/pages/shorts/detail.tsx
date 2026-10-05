import { useParams, Link, useLocation } from "wouter";
import {
  useGetShort, useDeleteShort,
  getListShortsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Eye, Share2, Volume2, VolumeX, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { DEMO_SHORTS } from "@/lib/demo-foods";
import { deleteLocalShort, getLocalShorts } from "@/lib/local-shorts";

export default function ShortDetail() {
  const { id } = useParams<{ id: string }>();
  const shortId = parseInt(id, 10);
  const [muted, setMuted] = useState(false);
  const [playbackError, setPlaybackError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: short, isLoading, isError } = useGetShort(shortId, {
    query: { enabled: !!shortId },
  });

  const deleteMutation = useDeleteShort();

  const localShort = getLocalShorts().find((item) => item.id === shortId);
  const fallbackShort = DEMO_SHORTS.find((item) => item.id === shortId);
  const selectedShort = short ?? localShort ?? fallbackShort;
  const isOwner = user && selectedShort && user.id === selectedShort.authorId;
  const videoUrl = selectedShort?.videoUrl || "";
  const embedUrl = (() => {
    try {
      const parsed = new URL(videoUrl);
      if (parsed.hostname.includes("youtube.com")) {
        const videoId = parsed.searchParams.get("v") || parsed.pathname.split("/").filter(Boolean).pop();
        return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=0&rel=0&enablejsapi=1` : null;
      }
      if (parsed.hostname === "youtu.be") {
        return `https://www.youtube-nocookie.com/embed/${parsed.pathname.slice(1)}?autoplay=1&mute=0&rel=0&enablejsapi=1`;
      }
      if (parsed.hostname.includes("vimeo.com")) {
        const videoId = parsed.pathname.split("/").filter(Boolean).pop();
        return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=0&api=1` : null;
      }
    } catch {
      return null;
    }
    return null;
  })();

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.info("Share: " + window.location.href);
    }
  };

  const handleDelete = () => {
    if (deleteLocalShort(shortId)) {
      toast.success("Short deleted successfully");
      setLocation("/shorts");
      return;
    }
    deleteMutation.mutate({ id: shortId }, {
      onSuccess: () => {
        toast.success("Short deleted successfully");
        queryClient.invalidateQueries({ queryKey: getListShortsQueryKey() });
        setLocation("/shorts");
      },
      onError: () => toast.error("Failed to delete short"),
    });
  };

  if (isLoading && !localShort && !fallbackShort) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-black">
        <Skeleton className="h-[80vh] max-h-[800px] aspect-[9/16] rounded-2xl" />
      </div>
    );
  }

  if (!selectedShort) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold mb-4">Video not found</h2>
        <Button asChild><Link href="/shorts">Back to Shorts</Link></Button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-black/95 flex items-center justify-center py-6 px-4">
      <div className="relative h-[85vh] max-h-[900px] aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center border border-white/10">

        {/* Top controls */}
        <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="text-white hover:bg-white/20 rounded-full bg-black/30 backdrop-blur"
          >
            <Link href="/shorts">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            {isOwner && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete short"
                    className="text-white hover:bg-red-500/30 rounded-full bg-black/30 backdrop-blur"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this short?</AlertDialogTitle>
                    <AlertDialogDescription>
                      "{selectedShort.title}" will be permanently deleted. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleDelete}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-full bg-black/30 backdrop-blur"
              onClick={() => {
                const newMuted = !muted;
                setMuted(newMuted);
                if (videoRef.current) {
                  videoRef.current.muted = newMuted;
                  if (!newMuted) void videoRef.current.play();
                }
                if (iframeRef.current?.contentWindow && embedUrl) {
                  const isVimeo = embedUrl.includes("vimeo.com");
                  iframeRef.current.contentWindow.postMessage(
                    isVimeo
                      ? { method: "setVolume", value: newMuted ? 0 : 1 }
                      : JSON.stringify({ event: "command", func: newMuted ? "mute" : "unMute", args: [] }),
                    "*",
                  );
                }
              }}
            >
              {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Video Player */}
        <div className="w-full h-full relative">
          {embedUrl ? (
            <iframe
              ref={iframeRef}
              src={embedUrl}
              title={selectedShort.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                src={videoUrl}
                poster={selectedShort.thumbnailUrl || undefined}
                autoPlay
                loop
                muted={muted}
                playsInline
                controls
                preload="auto"
                onLoadedData={() => setPlaybackError(false)}
                onError={() => setPlaybackError(true)}
                onClick={() => {
                  if (videoRef.current?.paused) {
                    videoRef.current.muted = false;
                    void videoRef.current.play();
                  }
                  else videoRef.current?.pause();
                }}
                className="w-full h-full object-cover"
              />
              {playbackError && (
                <div className="absolute inset-x-4 bottom-24 rounded-lg bg-black/80 p-3 text-center text-sm text-white">
                  This video cannot be played. Please upload an MP4/WebM file or use a YouTube/Vimeo link.
                </div>
              )}
            </>
          )}
        </div>

        {/* Interactive Sidebar */}
        <div className="absolute right-4 bottom-28 flex flex-col gap-5 items-center z-20">
          <div className="flex flex-col items-center gap-1">
            <div className="h-12 w-12 rounded-full bg-black/40 backdrop-blur border border-white/10 flex items-center justify-center">
              <Eye className="h-5 w-5 text-white/80" />
            </div>
            <span className="text-white text-xs font-medium drop-shadow-md">{selectedShort.views}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Button
              variant="secondary"
              size="icon"
              className="h-12 w-12 rounded-full bg-black/40 backdrop-blur text-white hover:bg-white/20 border border-white/10"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <span className="text-white text-xs font-medium drop-shadow-md">Share</span>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/70 to-transparent z-10 pt-20">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="border-2 border-white h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                {selectedShort.authorName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-semibold text-sm">{selectedShort.authorName}</p>
              <p className="text-white/60 text-xs capitalize">{selectedShort.authorRole}</p>
            </div>
          </div>
          <h1 className="text-white font-bold text-base mb-1 drop-shadow">{selectedShort.title}</h1>
          {selectedShort.description && (
            <p className="text-white/75 text-sm line-clamp-2 leading-relaxed">{selectedShort.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
