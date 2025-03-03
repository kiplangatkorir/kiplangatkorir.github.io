import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { type Post } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import CommentsSection from "@/components/comments-section";
import ShareButtons from "@/components/share-buttons";

export default function PostPage() {
  const [location] = useLocation();
  const [, params] = useRoute<{ id: string }>("/posts/:id");
  const { toast } = useToast();

  const { data: post, isLoading } = useQuery<Post>({
    queryKey: [`/api/posts/${params?.id}`],
  });

  const handleDelete = async () => {
    if (!post) return;
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await apiRequest("DELETE", `/api/posts/${post.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: "Post deleted successfully" });
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!post) return <div>Post not found</div>;

  const shareUrl = `${window.location.origin}${location}`;

  return (
    <div className="space-y-12">
      <article className="prose prose-lg max-w-none">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="mb-0">{post.title}</h1>
            <div className="flex items-center gap-4">
              <time className="text-sm text-muted-foreground">
                {new Date(post.createdAt).toLocaleDateString()}
              </time>
              <ShareButtons url={shareUrl} title={post.title} />
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/edit/${post.id}`}>
              <Button variant="outline" size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="destructive" size="icon" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </article>

      <CommentsSection postId={post.id} />
    </div>
  );
}