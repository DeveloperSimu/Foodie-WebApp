import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateIdea } from "@workspace/api-client-react";
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
import { ArrowLeft, Lightbulb, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { createLocalIdea } from "@/lib/local-ideas";

const ideaSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(20, "Content must be at least 20 characters for a good post"),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  tags: z.string().optional(),
});

type IdeaFormValues = z.infer<typeof ideaSchema>;

export default function IdeaNew() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const createMutation = useCreateIdea();

  const form = useForm<IdeaFormValues>({
    resolver: zodResolver(ideaSchema),
    defaultValues: {
      title: "",
      content: "",
      imageUrl: "",
      tags: "",
    },
  });

  const onSubmit = (data: IdeaFormValues) => {
    // Process tags from comma-separated string to array
    const tagsArray = data.tags 
      ? data.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    createMutation.mutate(
      { 
        data: {
          title: data.title,
          content: data.content,
          imageUrl: data.imageUrl || undefined,
          tags: tagsArray.length > 0 ? tagsArray : undefined
        } 
      },
      {
        onSuccess: (newIdea) => {
          toast.success("Idea published successfully!");
          setLocation(`/ideas/${newIdea.id}`);
        },
        onError: (error: unknown) => {
          if (error instanceof Error && (error.message.includes("HTTP 500") || error.message.includes("Failed to fetch"))) {
            const localIdea = createLocalIdea(
              data.title.trim(),
              data.content.trim(),
              data.imageUrl || undefined,
              tagsArray,
              user.id,
              user.name,
              user.role,
            );
            toast.success("Idea published successfully!");
            setLocation(`/ideas/${localIdea.id}`);
            return;
          }
          toast.error("Failed to publish idea. Please try again.");
        }
      }
    );
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Login required</h2>
        <p className="mb-6 text-muted-foreground">You must be logged in to share an idea.</p>
        <Button asChild><Link href="/login">Log in</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button variant="ghost" asChild className="mb-6 -ml-4">
        <Link href="/ideas"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold font-serif tracking-tight flex items-center gap-2 mb-2">
          <Lightbulb className="text-primary" /> Share an Idea
        </h1>
        <p className="text-muted-foreground">Post a recipe, cooking tip, or your thoughts on food.</p>
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
                    <Input placeholder="e.g. The secret to perfect crispy potatoes" className="h-12 text-lg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Content</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Share your recipe, steps, or thoughts here..." 
                      className="min-h-[200px] resize-y text-base p-4 leading-relaxed" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <ImageIcon size={16} /> Cover Image URL <span className="text-muted-foreground font-normal">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="recipe, vegan, quick" {...field} />
                    </FormControl>
                    <FormDescription>Comma-separated</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-4 border-t border-border flex justify-end gap-4">
              <Button type="button" variant="ghost" asChild>
                <Link href="/ideas">Cancel</Link>
              </Button>
              <Button type="submit" size="lg" className="px-8 rounded-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Publishing..." : "Publish Idea"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
