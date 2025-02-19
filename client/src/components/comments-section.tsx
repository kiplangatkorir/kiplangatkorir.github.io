import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type Comment } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

interface CommentsSectionProps {
  postId: number;
}

export default function CommentsSection({ postId }: CommentsSectionProps) {
  const [content, setContent] = useState("");
  const { toast } = useToast();

  const { data: comments, isLoading } = useQuery<Comment[]>({
    queryKey: [`/api/posts/${postId}/comments`],
  });

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("POST", `/api/posts/${postId}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/comments`] });
      setContent("");
      toast({ title: "Comment added successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await apiRequest("DELETE", `/api/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/comments`] });
      toast({ title: "Comment deleted successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to delete comment",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createCommentMutation.mutate(content);
  };

  const handleDelete = (commentId: number) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Comments</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          className="min-h-[100px]"
        />
        <Button 
          type="submit" 
          disabled={createCommentMutation.isPending || !content.trim()}
        >
          Add Comment
        </Button>
      </form>

      <div className="space-y-4">
        {isLoading ? (
          <p>Loading comments...</p>
        ) : comments?.length === 0 ? (
          <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
        ) : (
          comments?.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="whitespace-pre-wrap">{comment.content}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(comment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
