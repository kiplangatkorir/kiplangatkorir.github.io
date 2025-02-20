import express, { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import { logger } from "./logger";
import { Session } from 'express-session';

// Extend Session type to include our custom properties
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

// Create a new router instance
const apiRouter = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: path.join(process.cwd(), "uploads"),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Auth routes
apiRouter.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const existingUser = await storage.getUserByUsername(username);
    
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }
    
    const user = await storage.createUser({ username, password });
    req.session.userId = user.id;
    res.json(user);
  } catch (error) {
    logger.error(`Registration error: ${error}`);
    res.status(500).json({ message: "Error creating user" });
  }
});

apiRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const user = await storage.getUserByUsername(username);
    
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    req.session.userId = user.id;
    res.json(user);
  } catch (error) {
    logger.error(`Login error: ${error}`);
    res.status(500).json({ message: "Error logging in" });
  }
});

apiRouter.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      logger.error(`Logout error: ${err}`);
      return res.status(500).json({ message: "Error logging out" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

// Post routes
apiRouter.get("/posts", async (_req: Request, res: Response) => {
  try {
    const posts = await storage.getAllPosts();
    res.json(posts);
  } catch (error) {
    logger.error(`Error fetching posts: ${error}`);
    res.status(500).json({ message: "Error fetching posts" });
  }
});

apiRouter.get("/posts/:id", async (req: Request, res: Response) => {
  try {
    const post = await storage.getPost(Number(req.params.id));
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post);
  } catch (error) {
    logger.error(`Error fetching post: ${error}`);
    res.status(500).json({ message: "Error fetching post" });
  }
});

apiRouter.post("/posts", requireAuth, async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;
    // We know userId exists because of requireAuth middleware
    const userId = req.session.userId!;
    const post = await storage.createPost({
      title,
      content,
      userId,
    });
    res.json(post);
  } catch (error) {
    logger.error(`Error creating post: ${error}`);
    res.status(500).json({ message: "Error creating post" });
  }
});

apiRouter.put("/posts/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;
    const post = await storage.updatePost(Number(req.params.id), {
      title,
      content,
    });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post);
  } catch (error) {
    logger.error(`Error updating post: ${error}`);
    res.status(500).json({ message: "Error updating post" });
  }
});

apiRouter.delete("/posts/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const success = await storage.deletePost(Number(req.params.id));
    if (!success) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    logger.error(`Error deleting post: ${error}`);
    res.status(500).json({ message: "Error deleting post" });
  }
});

// Comment routes
apiRouter.get("/posts/:postId/comments", async (req: Request, res: Response) => {
  try {
    const comments = await storage.getPostComments(Number(req.params.postId));
    res.json(comments);
  } catch (error) {
    logger.error(`Error fetching comments: ${error}`);
    res.status(500).json({ message: "Error fetching comments" });
  }
});

apiRouter.post("/posts/:postId/comments", requireAuth, async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    // We know userId exists because of requireAuth middleware
    const userId = req.session.userId!;
    const comment = await storage.createComment({
      content,
      postId: Number(req.params.postId),
      userId,
    });
    res.json(comment);
  } catch (error) {
    logger.error(`Error creating comment: ${error}`);
    res.status(500).json({ message: "Error creating comment" });
  }
});

apiRouter.delete("/comments/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const success = await storage.deleteComment(Number(req.params.id));
    if (!success) {
      return res.status(404).json({ message: "Comment not found" });
    }
    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    logger.error(`Error deleting comment: ${error}`);
    res.status(500).json({ message: "Error deleting comment" });
  }
});

// Export the router
export { apiRouter as router };