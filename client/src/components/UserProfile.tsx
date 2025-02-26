import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';

interface User {
  id: number;
  email: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  twitterHandle: string | null;
  websiteUrl: string | null;
  createdAt: string;
}

interface Post {
  id: number;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  coverImageUrl: string | null;
  readingTime: number;
  createdAt: string;
  clapsCount: number;
}

export function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [userRes, postsRes, followersRes, followingRes] = await Promise.all([
          fetch(`/api/users/${id}`),
          fetch(`/api/users/${id}/posts`),
          fetch(`/api/users/${id}/followers`),
          fetch(`/api/users/${id}/following`),
        ]);

        const [userData, postsData, followersData, followingData] = await Promise.all([
          userRes.json(),
          postsRes.json(),
          followersRes.json(),
          followingRes.json(),
        ]);

        setUser(userData);
        setPosts(postsData);
        setFollowers(followersData);
        setFollowing(followingData);
        setIsFollowing(followersData.some((f: User) => f.id === currentUser?.id));
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [id, currentUser?.id]);

  const handleFollow = async () => {
    if (!currentUser) return;

    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      await fetch(`/api/users/${id}/follow`, { method });
      setIsFollowing(!isFollowing);
      setFollowers(prev => 
        isFollowing 
          ? prev.filter(f => f.id !== currentUser.id)
          : [...prev, currentUser as User]
      );
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">User not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center mb-8">
        <Avatar className="w-32 h-32 mb-4">
          <AvatarImage src={user.avatarUrl || undefined} />
          <AvatarFallback>{user.name?.[0] || user.email[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <h1 className="text-3xl font-bold mb-2">{user.name || 'Anonymous'}</h1>
        {user.bio && <p className="text-gray-600 text-center max-w-2xl mb-4">{user.bio}</p>}
        <div className="flex gap-4 mb-4">
          {user.twitterHandle && (
            <a
              href={`https://twitter.com/${user.twitterHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600"
            >
              Twitter
            </a>
          )}
          {user.websiteUrl && (
            <a
              href={user.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600"
            >
              Website
            </a>
          )}
        </div>
        {currentUser && currentUser.id !== user.id && (
          <Button
            onClick={handleFollow}
            variant={isFollowing ? "outline" : "default"}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
        )}
      </div>

      <Tabs defaultValue="stories" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stories">Stories ({posts.length})</TabsTrigger>
          <TabsTrigger value="followers">Followers ({followers.length})</TabsTrigger>
          <TabsTrigger value="following">Following ({following.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="stories" className="mt-6">
          <div className="grid gap-6">
            {posts.map(post => (
              <Card key={post.id}>
                {post.coverImageUrl && (
                  <img
                    src={post.coverImageUrl}
                    alt={post.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                )}
                <CardHeader>
                  <CardTitle>{post.title}</CardTitle>
                  {post.subtitle && <p className="text-gray-600">{post.subtitle}</p>}
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{post.excerpt}</p>
                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                    <span>{formatDate(post.createdAt)}</span>
                    <span>{post.readingTime} min read</span>
                    <span>{post.clapsCount} claps</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="followers" className="mt-6">
          <div className="grid gap-4">
            {followers.map(follower => (
              <Card key={follower.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar>
                    <AvatarImage src={follower.avatarUrl || undefined} />
                    <AvatarFallback>
                      {follower.name?.[0] || follower.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{follower.name || 'Anonymous'}</h3>
                    {follower.bio && (
                      <p className="text-sm text-gray-600">{follower.bio}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="following" className="mt-6">
          <div className="grid gap-4">
            {following.map(followed => (
              <Card key={followed.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar>
                    <AvatarImage src={followed.avatarUrl || undefined} />
                    <AvatarFallback>
                      {followed.name?.[0] || followed.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{followed.name || 'Anonymous'}</h3>
                    {followed.bio && (
                      <p className="text-sm text-gray-600">{followed.bio}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
