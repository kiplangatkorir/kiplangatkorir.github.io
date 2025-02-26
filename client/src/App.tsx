import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NavBar from "@/components/nav-bar";
import Home from "@/pages/home";
import Post from "@/pages/post";
import Editor from "@/pages/editor";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/posts/:id" component={Post} />
          <ProtectedRoute path="/new" component={Editor} />
          <ProtectedRoute path="/edit/:id" component={Editor} />
          <Route path="/profile/:id" component={Profile} />
          <ProtectedRoute path="/settings" component={Settings} />
          <Route path="/auth" component={AuthPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;