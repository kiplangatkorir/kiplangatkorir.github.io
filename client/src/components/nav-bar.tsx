import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { PenSquare, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function NavBar() {
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <h1 className="text-2xl font-bold cursor-pointer">Blog</h1>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/new">
            <Button>
              <PenSquare className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </Link>
          <Button
            variant="ghost"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}