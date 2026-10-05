import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateShort } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { ArrowLeft, Video, Image as ImageIcon, Info } from "lucide-react";
import { toast } from "sonner";
import { createLocalShort } from "@/lib/local-shorts";

const shortSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().optional(),
  videoUrl: z.string().refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:" || url.protocol === "data:";
    } catch {
      return false;
    }
  }, "Choose a video file or enter a valid video URL"),
  thumbnailUrl: z.string().refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:" || url.protocol === "data:";
    } catch {
      return false;
    }
  }, "Choose an image file or enter a valid image URL"),
});

type ShortFormValues = z.infer<typeof shortSchema>;

export default function ShortNew() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const createMutation = useCreateShort();
  const [videoFileName, setVideoFileName] = useState("");
  const [thumbnailFileName, setThumbnailFileName] = useState("");

  const readFileAsDataUrl = (file: File, maxBytes: number): Promise<string> =>
    new Promise((resolve, reject) => {
      if (file.size > maxBytes) {
        reject(new Error(`File must be smaller than ${Math.round(maxBytes / 1024 / 1024)}MB`));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Could not read file"));
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.readAsDataURL(file);
    });

  const form = useForm<ShortFormValues>({
    resolver: zodResolver(shortSchema),
    defaultValues: {
      title: "",
      description: "",
      videoUrl: "",
      thumbnailUrl: "",
    },
  });

  const onSubmit = (data: ShortFormValues) => {
    const localShort = () => {
      try {
        const created = createLocalShort(
          data.title.trim(),
          data.description?.trim(),
          data.videoUrl,
          data.thumbnailUrl || undefined,
          user.id,
          user.name,
          user.role,
        );
        toast.success("Short uploaded successfully!");
        setLocation(`/shorts/${created.id}`);
      } catch {
        toast.error("Could not save this short. Try a smaller video file.");
      }
    };

    if (data.videoUrl.startsWith("data:")) {
      localShort();
      return;
    }

    createMutation.mutate(
      {
        data: {
          title: data.title,
          description: data.description || undefined,
          videoUrl: data.videoUrl,
          thumbnailUrl: data.thumbnailUrl || undefined,
        },
      },
      {
        onSuccess: (newShort) => {
          toast.success("Short uploaded successfully!");
          setLocation(`/shorts/${newShort.id}`);
        },
        onError: () => {
          localShort();
        },
      }
    );
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Login Required</h2>
        <p className="mb-6 text-muted-foreground">You must be logged in to upload a cooking short.</p>
        <Button asChild><Link href="/login">Log in</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button variant="ghost" asChild className="mb-6 -ml-4">
        <Link href="/shorts"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold font-serif tracking-tight flex items-center gap-2 mb-2">
          <Video className="text-primary" /> Upload Short
        </h1>
        <p className="text-muted-foreground">Share a quick cooking video with the community.</p>
      </div>

      <div className="bg-muted/30 border border-border rounded-xl p-4 mb-6 flex gap-3 text-sm">
        <Info size={16} className="text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium mb-1">How to add a video</p>
          <p className="text-muted-foreground">Paste any publicly accessible video URL (e.g. from YouTube, Vimeo, or a direct .mp4 link). You can find the direct link by right-clicking a video and selecting "Copy video address".</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Perfect crispy fried chicken in 10 minutes" className="h-12 text-lg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="videoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold flex items-center gap-2">
                    <Video size={16} /> Video URL *
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/video.mp4" {...field} />
                  </FormControl>
                  <div className="text-sm text-muted-foreground">or choose a video from this device</div>
                  <Input
                   type="file"
                   accept="video/mp4,video/webm,video/*"
                   onChange={async (event) => {
                     const file = event.target.files?.[0];
                     if (!file) return;
                     try {
                       const dataUrl = await readFileAsDataUrl(file, 4 * 1024 * 1024);
                       form.setValue("videoUrl", dataUrl, { shouldValidate: true });
                       setVideoFileName(file.name);
                       toast.success("Video selected");
                     } catch (error) {
                       toast.error(error instanceof Error ? error.message : "Could not read video");
                     }
                   }}
                  />
                  {videoFileName && <FormDescription>Selected: {videoFileName}</FormDescription>}
                  <FormDescription>Direct link to a .mp4, .webm, or other video file</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">
                    Description <span className="text-muted-foreground font-normal">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Briefly describe what this short is about..."
                      className="min-h-[100px] resize-y text-base p-4"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thumbnailUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <ImageIcon size={16} /> Thumbnail Image URL{" "}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/thumbnail.jpg" {...field} />
                  </FormControl>
                  <div className="text-sm text-muted-foreground">or choose a cover image</div>
                  <Input
                   type="file"
                   accept="image/png,image/jpeg,image/webp,image/gif"
                   onChange={async (event) => {
                     const file = event.target.files?.[0];
                     if (!file) return;
                     try {
                       const dataUrl = await readFileAsDataUrl(file, 2 * 1024 * 1024);
                       form.setValue("thumbnailUrl", dataUrl);
                       setThumbnailFileName(file.name);
                       toast.success("Thumbnail selected");
                     } catch (error) {
                       toast.error(error instanceof Error ? error.message : "Could not read image");
                     }
                   }}
                  />
                  {thumbnailFileName && <FormDescription>Selected: {thumbnailFileName}</FormDescription>}
                  <FormDescription>A cover image shown before the video plays</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 border-t border-border flex justify-end gap-4">
              <Button type="button" variant="ghost" asChild>
                <Link href="/shorts">Cancel</Link>
              </Button>
              <Button type="submit" size="lg" className="px-8 rounded-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Uploading..." : "Upload Short"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
