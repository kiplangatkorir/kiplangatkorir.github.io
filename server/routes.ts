import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertPostSchema, insertCommentSchema } from "@shared/schema";

export async function registerRoutes(app: Express) {
  app.get("/api/posts", async (_req, res) => {
    const posts = await storage.getAllPosts();
    res.json(posts);
  });

  app.get("/api/posts/search", async (req, res) => {
    const query = req.query.q as string;
    if (!query) return res.json([]);
    const posts = await storage.searchPosts(query);
    res.json(posts);
  });

  app.get("/api/posts/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const post = await storage.getPost(id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  });

  app.post("/api/posts", async (req, res) => {
    const result = insertPostSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid post data" });
    }
    const post = await storage.createPost(result.data);
    res.status(201).json(post);
  });

  app.put("/api/posts/:id", async (req, res) => {
    const result = insertPostSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid post data" });
    }
    const id = parseInt(req.params.id);
    const post = await storage.updatePost(id, result.data);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  });

  app.delete("/api/posts/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await storage.deletePost(id);
    if (!success) return res.status(404).json({ message: "Post not found" });
    res.status(204).end();
  });

  // New routes for comments
  app.get("/api/posts/:postId/comments", async (req, res) => {
    const postId = parseInt(req.params.postId);
    const comments = await storage.getPostComments(postId);
    res.json(comments);
  });

  app.post("/api/posts/:postId/comments", async (req, res) => {
    const postId = parseInt(req.params.postId);
    const result = insertCommentSchema.safeParse({ ...req.body, postId });
    if (!result.success) {
      return res.status(400).json({ message: "Invalid comment data" });
    }
    const comment = await storage.createComment(result.data);
    res.status(201).json(comment);
  });

  app.delete("/api/comments/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteComment(id);
    if (!success) return res.status(404).json({ message: "Comment not found" });
    res.status(204).end();
  });

  return createServer(app);
}