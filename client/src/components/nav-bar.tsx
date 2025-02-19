import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { PenSquare } from "lucide-react";

export default function NavBar() {
  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <h1 className="text-2xl font-bold cursor-pointer">Blog</h1>
        </Link>
        <Link href="/new">
          <Button>
            <PenSquare className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </Link>
      </div>
    </nav>
  );
}
