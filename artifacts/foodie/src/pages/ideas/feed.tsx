import { Link } from "wouter";
import { useListIdeas, useDeleteIdea, getListIdeasQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { MessageSquare, Plus, Lightbulb, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { DEMO_IDEAS } from "@/lib/demo-ideas";
import { deleteLocalIdea, getLocalIdeas } from "@/lib/local-ideas";

export default function IdeasFeed() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: ideas, isLoading } = useListIdeas();
  const apiIdeas = Array.isArray(ideas) ? ideas : [];
  const ideaList = [...getLocalIdeas(), ...(apiIdeas.length > 0 ? apiIdeas : DEMO_IDEAS)];
  const deleteMutation = useDeleteIdea();
  const handleDelete = (e: React.MouseEvent, ideaId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (deleteLocalIdea(ideaId)) {
      toast.success("Idea deleted");
      queryClient.invalidateQueries({ queryKey: getListIdeasQueryKey() });
      return;
    }
    deleteMutation.mutate({ id: ideaId }, {
      onSuccess: () => {
        toast.success("Idea deleted");
        queryClient.invalidateQueries({ queryKey: getListIdeasQueryKey() });
      },
      onError: () => toast.error("Failed to delete idea"),
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-serif tracking-tight text-foreground mb-2 flex items-center gap-2">
            <Lightbulb className="text-primary" /> Cooking Ideas
          </h1>
          <p className="text-muted-foreground">Recipes, techniques, and food thoughts from the community</p>
        </div>

        {user && (
          <Button asChild className="rounded-full px-6">
            <Link href="/ideas/new">
              <Plus className="mr-2 h-4 w-4" /> Share an Idea
            </Link>
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : ideaList.length ? (
          ideaList.map((idea) => {
            const isOwner = user && user.id === idea.authorId;
            return (
              <Link key={idea.id} href={`/ideas/${idea.id}`}>
                <Card className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer overflow-hidden group">
                  <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Avatar>
                        <AvatarFallback className={idea.authorRole === 'cafe' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}>
                          {idea.authorName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold truncate">{idea.authorName}</span>
                          {idea.authorRole === 'cafe' && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex-shrink-0">Cafe</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(idea.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    {isOwner && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex-shrink-0"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this idea?</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{idea.title}" will be permanently deleted along with all its comments. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={(e) => handleDelete(e, idea.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </CardHeader>

                  <CardContent>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{idea.title}</h3>
                    <p className="text-muted-foreground line-clamp-3 mb-4">{idea.content}</p>

                    {idea.imageUrl && (
                      <div className="relative h-64 w-full rounded-lg overflow-hidden mb-4 bg-muted">
                        <img src={idea.imageUrl} alt="" className="object-cover w-full h-full group-hover:scale-[1.02] transition-transform duration-500" />
                      </div>
                    )}

                    {idea.tags && idea.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {(Array.isArray(idea.tags) ? idea.tags : []).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs text-muted-foreground">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="bg-secondary/20 pt-4 flex gap-6 text-muted-foreground border-t border-border/50">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MessageSquare size={18} />
                      {idea.reviewCount}
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            );
          })
        ) : (
          <div className="py-20 text-center bg-card rounded-2xl border border-dashed flex flex-col items-center">
            <Lightbulb size={48} className="text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold mb-2">No ideas shared yet</h3>
            <p className="text-muted-foreground mb-6">Be the first to share a recipe or cooking thought!</p>
            {user && (
              <Button asChild>
                <Link href="/ideas/new">Share Idea</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
