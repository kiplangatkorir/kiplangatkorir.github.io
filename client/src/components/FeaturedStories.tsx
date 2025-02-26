import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClapButton } from './ClapButton';
import { formatDate } from '@/lib/utils';

interface Author {
  id: number;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

interface FeaturedPost {
  id: number;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  coverImageUrl: string | null;
  readingTime: number;
  clapsCount: number;
  createdAt: string;
  author: Author;
}

export function FeaturedStories() {
  const [posts, setPosts] = useState<FeaturedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedPosts = async () => {
      try {
        const response = await fetch('/api/posts/featured');
        if (!response.ok) {
          throw new Error('Failed to fetch featured posts');
        }
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error('Error fetching featured posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedPosts();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6">Featured Stories</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg" />
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-5/6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6">Featured Stories</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={`/posts/${post.id}`}>
              <Card className="h-full hover:shadow-lg transition-shadow duration-200">
                {post.coverImageUrl && (
                  <img
                    src={post.coverImageUrl}
                    alt={post.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                )}
                <CardHeader>
                  <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                  {post.subtitle && (
                    <p className="text-gray-600 line-clamp-1">{post.subtitle}</p>
                  )}
                </CardHeader>
                <CardContent>
                  {post.excerpt && (
                    <p className="text-gray-600 line-clamp-3 mb-4">{post.excerpt}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={post.author.avatarUrl || undefined} />
                      <AvatarFallback>
                        {post.author.name?.[0] || post.author.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{post.author.name || 'Anonymous'}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(post.createdAt)} · {post.readingTime} min read
                      </p>
                    </div>
                    <ClapButton
                      postId={post.id}
                      initialCount={post.clapsCount}
                      onClap={(newCount) => {
                        setPosts(prev =>
                          prev.map(p =>
                            p.id === post.id ? { ...p, clapsCount: newCount } : p
                          )
                        );
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
