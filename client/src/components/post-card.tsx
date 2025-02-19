import { type Post } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Link } from "wouter";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const preview = post.content.slice(0, 150) + (post.content.length > 150 ? "..." : "");

  return (
    <Link href={`/posts/${post.id}`}>
      <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader>
          <h2 className="text-xl font-semibold line-clamp-2">{post.title}</h2>
          <time className="text-sm text-muted-foreground">
            {new Date(post.createdAt).toLocaleDateString()}
          </time>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground line-clamp-3">{preview}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
