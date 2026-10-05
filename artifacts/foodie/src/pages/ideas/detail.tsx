import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import {
  useGetIdea, useListIdeaReviews, useCreateIdeaReview, useDeleteIdea,
  getListIdeasQueryKey, getGetIdeaQueryKey, getListIdeaReviewsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { ArrowLeft, MessageSquare, Star, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { DEMO_IDEA_REVIEWS, getDemoIdea } from "@/lib/demo-ideas";
import { deleteLocalIdea, getLocalIdeas } from "@/lib/local-ideas";
import { createLocalReview, getLocalReviews } from "@/lib/local-reviews";

export default function IdeaDetail() {
  const { id } = useParams<{ id: string }>();
  const ideaId = parseInt(id, 10);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [, refreshLocalReviews] = useState(0);

  const { data: idea, isLoading: isLoadingIdea } = useGetIdea(ideaId, {
    query: { enabled: !!ideaId }
  });

  const { data: reviews, isLoading: isLoadingReviews } = useListIdeaReviews(ideaId, {
    query: { enabled: !!ideaId }
  });
  const localReviews = getLocalReviews(ideaId);
  const reviewList = [
    ...localReviews,
    ...(Array.isArray(reviews) && reviews.length > 0
      ? reviews
      : DEMO_IDEA_REVIEWS.filter((review) => review.ideaId === ideaId)),
  ];

  const reviewMutation = useCreateIdeaReview();
  const deleteMutation = useDeleteIdea();
  const demoIdea = getDemoIdea(ideaId);
  const localIdea = getLocalIdeas().find((item) => item.id === ideaId);
  const selectedIdea = idea ?? localIdea ?? demoIdea;

  const isOwner = user && selectedIdea && user.id === selectedIdea.authorId;

  const submitReview = () => {
    if (!comment.trim()) {
      toast.error("Please enter a comment");
      return;
    }
    const saveLocalReview = () => {
      if (!user) return;
      createLocalReview(ideaId, user.id, user.name, comment.trim(), rating);
      refreshLocalReviews((version) => version + 1);
      toast.success("Comment posted!");
      setComment("");
      setRating(5);
    };

    if (localIdea) {
      saveLocalReview();
      return;
    }

    reviewMutation.mutate(
      { id: ideaId, data: { comment, rating } },
      {
        onSuccess: () => {
          toast.success("Review posted!");
          setComment("");
          setRating(5);
          queryClient.invalidateQueries({ queryKey: getListIdeaReviewsQueryKey(ideaId) });
          queryClient.invalidateQueries({ queryKey: getGetIdeaQueryKey(ideaId) });
        },
        onError: () => saveLocalReview(),
      }
    );
  };

  const handleDelete = () => {
    if (deleteLocalIdea(ideaId)) {
      toast.success("Idea deleted successfully");
      queryClient.invalidateQueries({ queryKey: getListIdeasQueryKey() });
      setLocation("/ideas");
      return;
    }
    deleteMutation.mutate({ id: ideaId }, {
      onSuccess: () => {
        toast.success("Idea deleted successfully");
        queryClient.invalidateQueries({ queryKey: getListIdeasQueryKey() });
        setLocation("/ideas");
      },
      onError: () => toast.error("Failed to delete idea"),
    });
  };

  if (isLoadingIdea) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Skeleton className="h-10 w-24 mb-8" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <div className="flex gap-4 mb-8">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-64 w-full mb-8" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!selectedIdea) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Idea not found</h2>
        <Button asChild><Link href="/ideas">Back to Ideas</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" asChild className="-ml-4 text-muted-foreground">
          <Link href="/ideas"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
        </Button>

        {isOwner && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 border-destructive/30 gap-2">
                <Trash2 size={14} /> Delete Post
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this idea?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove                   "{selectedIdea.title}" and all its comments. This cannot be undone.
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
      </div>

      <div className="mb-10">
        {selectedIdea.tags && selectedIdea.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {(Array.isArray(selectedIdea.tags) ? selectedIdea.tags : []).map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="bg-primary/10 text-primary">#{tag}</Badge>
            ))}
          </div>
        )}

        <h1 className="text-4xl md:text-5xl font-bold font-serif tracking-tight mb-6">{selectedIdea.title}</h1>

        <div className="flex items-center justify-between pb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarFallback className="bg-secondary">{selectedIdea.authorName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-lg flex items-center gap-2">
                {selectedIdea.authorName}
                {selectedIdea.authorRole === 'cafe' && <Badge variant="default" className="h-5 px-1.5 text-[10px]">Cafe</Badge>}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(selectedIdea.createdAt), { addSuffix: true })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center text-muted-foreground">
              <MessageSquare size={24} className="mb-1" />
              <span className="text-xs font-bold">{selectedIdea.reviewCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
        {selectedIdea.imageUrl && (
          <div className="rounded-2xl overflow-hidden my-8 shadow-md">
            <img src={selectedIdea.imageUrl} alt="" className="w-full object-cover" />
          </div>
        )}
        <div className="whitespace-pre-wrap leading-relaxed text-foreground/90">
          {selectedIdea.content}
        </div>
      </div>

      <Separator className="my-10" />

      <div className="mb-12">
        <h3 className="text-2xl font-bold font-serif mb-6">Discussion ({reviewList.length})</h3>

        {user ? (
          <div className="bg-secondary/30 p-6 rounded-xl mb-10 border border-border/50">
            <h4 className="font-semibold mb-4">Add your thoughts</h4>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground">Rating:</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setRating(star)} className="p-1 focus:outline-none">
                    <Star size={20} className={star <= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"} />
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              placeholder="What do you think about this idea?"
              className="min-h-[100px] mb-4 resize-none bg-background"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="flex justify-end">
              <Button onClick={submitReview} disabled={reviewMutation.isPending} className="rounded-full px-6">
                {reviewMutation.isPending ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-secondary/30 p-6 rounded-xl mb-10 border border-border/50 flex flex-col items-center text-center">
            <p className="mb-4">Log in to join the discussion and share your thoughts.</p>
            <Button asChild><Link href="/login">Log in</Link></Button>
          </div>
        )}

        <div className="space-y-6">
          {isLoadingReviews ? (
            <Skeleton className="h-32 w-full rounded-xl" />
          ) : reviewList.length ? (
            reviewList.map((review) => (
              <div key={review.id} className="p-5 rounded-xl border border-border/50 bg-card">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{review.authorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-sm">{review.authorName}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={14} className={star <= review.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"} />
                    ))}
                  </div>
                </div>
                <p className="text-foreground/80 text-sm">{review.comment}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              No comments yet. Be the first to share your thoughts!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
