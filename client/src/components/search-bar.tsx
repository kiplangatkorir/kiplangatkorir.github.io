import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { type Post } from "@shared/schema";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { useDebounce } from "@/hooks/use-debounce";
import { Search } from "lucide-react";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const { data: results } = useQuery<Post[]>({
    queryKey: [`/api/posts/search?q=${debouncedQuery}`],
    enabled: debouncedQuery.length > 0,
  });

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search posts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      
      {query && results && results.length > 0 && (
        <Card className="absolute mt-1 w-full z-50">
          <CardContent className="p-2">
            {results.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`}>
                <div className="p-2 hover:bg-accent rounded cursor-pointer">
                  <div className="font-medium">{post.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
