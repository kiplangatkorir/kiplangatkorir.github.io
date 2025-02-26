import express, { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import { logger } from "./logger";
import { Session } from 'express-session';
import { StorageService } from './storage-service';

const storageService = new StorageService();

// Extend Session type to include our custom properties
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

// Create a new router instance
const apiRouter = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  }
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
    const { email, password } = req.body;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    
    const existingUser = await storage.getUserByEmail(email);
    
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }
    
    const user = await storage.createUser({ email, password });
    req.session.userId = user.id;
    res.json(user);
  } catch (error) {
    logger.error(`Registration error: ${error}`);
    res.status(500).json({ message: "Error creating user" });
  }
});

apiRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await storage.getUserByEmail(email);
    
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
    const userId = req.session.userId;
    const {
      title,
      subtitle,
      content,
      coverImageUrl,
      excerpt,
      published,
      categoryId,
      tagIds,
    } = req.body;

    // Calculate reading time (rough estimate: 200 words per minute)
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    const post = await storage.createPost({
      title,
      subtitle,
      content,
      coverImageUrl,
      excerpt: excerpt || content.substring(0, 200) + "...", // Auto-generate excerpt if not provided
      readingTime,
      published: published ?? false,
      categoryId,
      userId,
      tagIds,
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

// User profile routes
apiRouter.get("/users/:id", async (req: Request, res: Response) => {
  try {
    const user = await storage.getUser(parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Don't send password in response
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    logger.error(`Error fetching user: ${error}`);
    res.status(500).json({ message: "Error fetching user" });
  }
});

apiRouter.put("/users/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    if (req.session.userId !== parseInt(req.params.id)) {
      return res.status(403).json({ message: "Unauthorized to update this profile" });
    }
    
    const { name, bio, avatarUrl, twitterHandle, websiteUrl } = req.body;
    const updatedUser = await storage.updateUser(parseInt(req.params.id), {
      name,
      bio,
      avatarUrl,
      twitterHandle,
      websiteUrl,
    });
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    logger.error(`Error updating user: ${error}`);
    res.status(500).json({ message: "Error updating user" });
  }
});

// Follow/Unfollow routes
apiRouter.post("/users/:id/follow", requireAuth, async (req: Request, res: Response) => {
  try {
    const followerId = req.session.userId;
    const followingId = parseInt(req.params.id);
    
    if (followerId === followingId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }
    
    await storage.createFollow({ followerId, followingId });
    res.json({ message: "Successfully followed user" });
  } catch (error) {
    logger.error(`Error following user: ${error}`);
    res.status(500).json({ message: "Error following user" });
  }
});

apiRouter.delete("/users/:id/follow", requireAuth, async (req: Request, res: Response) => {
  try {
    const followerId = req.session.userId;
    const followingId = parseInt(req.params.id);
    
    await storage.deleteFollow(followerId, followingId);
    res.json({ message: "Successfully unfollowed user" });
  } catch (error) {
    logger.error(`Error unfollowing user: ${error}`);
    res.status(500).json({ message: "Error unfollowing user" });
  }
});

// Post routes with claps
apiRouter.post("/posts/:id/clap", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    const postId = parseInt(req.params.id);
    const count = req.body.count || 1;
    
    const clap = await storage.createOrUpdateClap({
      userId,
      postId,
      count,
    });
    
    res.json(clap);
  } catch (error) {
    logger.error(`Error clapping for post: ${error}`);
    res.status(500).json({ message: "Error clapping for post" });
  }
});

// Get featured posts
apiRouter.get("/posts/featured", async (req: Request, res: Response) => {
  try {
    const featuredPosts = await storage.getFeaturedPosts();
    res.json(featuredPosts);
  } catch (error) {
    logger.error(`Error fetching featured posts: ${error}`);
    res.status(500).json({ message: "Error fetching featured posts" });
  }
});

// Serve static files from uploads directory
apiRouter.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// File upload routes
apiRouter.post("/upload", requireAuth, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileUrl = await storageService.uploadFile(req.file);
    res.json({ url: fileUrl });
  } catch (error) {
    logger.error(`Error uploading file: ${error}`);
    res.status(500).json({ message: "Error uploading file" });
  }
});

// Delete uploaded file
apiRouter.delete("/upload/:filename", requireAuth, async (req: Request, res: Response) => {
  try {
    const fileUrl = `/uploads/${req.params.filename}`;
    await storageService.deleteFile(fileUrl);
    res.json({ message: "File deleted successfully" });
  } catch (error) {
    logger.error(`Error deleting file: ${error}`);
    res.status(500).json({ message: "Error deleting file" });
  }
});

// Get signed URL for client-side upload
apiRouter.post("/upload/signed-url", requireAuth, async (req: Request, res: Response) => {
  try {
    const { fileName, contentType } = req.body;
    
    if (!fileName || !contentType) {
      return res.status(400).json({ message: "fileName and contentType are required" });
    }

    const signedUrl = await storageService.getSignedUploadUrl(fileName, contentType);
    res.json({ signedUrl });
  } catch (error) {
    logger.error(`Error generating signed URL: ${error}`);
    res.status(500).json({ message: "Error generating upload URL" });
  }
});

// Export the router
export { apiRouter as router };