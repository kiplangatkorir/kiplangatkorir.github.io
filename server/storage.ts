import { users, posts, comments, categories, tags, postsTags, type User, type InsertUser, type Post, type InsertPost, type Comment, type InsertComment, type Category, type InsertCategory, type Tag, type InsertTag } from "@shared/schema";
import { db } from "./db";
import { eq, or, sql, and } from "drizzle-orm";
import session from "express-session";
import { logger } from './logger';

// Session Store Implementation
class MemoryStore extends session.Store {
  private sessions: Map<string, any>;

  constructor() {
    super();
    this.sessions = new Map();
    logger.warn('Using MemoryStore for sessions. This is not suitable for production.');
  }

  get(sid: string, callback: (err: any, session?: any) => void): void {
    const data = this.sessions.get(sid);
    callback(null, data);
  }

  set(sid: string, session: any, callback?: (err?: any) => void): void {
    this.sessions.set(sid, session);
    if (callback) callback();
  }

  destroy(sid: string, callback?: (err?: any) => void): void {
    this.sessions.delete(sid);
    if (callback) callback();
  }
}

// Create and export session store instance
export const sessionStore = new MemoryStore();

// Database Storage Interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Post methods
  getAllPosts(): Promise<Post[]>;
  getPost(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost & { userId: number }): Promise<Post>;
  updatePost(id: number, post: InsertPost): Promise<Post | undefined>;
  deletePost(id: number): Promise<boolean>;
  searchPosts(query: string): Promise<Post[]>;

  // Comment methods
  getPostComments(postId: number): Promise<Comment[]>;
  createComment(comment: InsertComment & { userId: number }): Promise<Comment>;
  deleteComment(id: number): Promise<boolean>;

  // Category methods
  getAllCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Tag methods
  getAllTags(): Promise<Tag[]>;
  getTag(id: number): Promise<Tag | undefined>;
  createTag(tag: InsertTag): Promise<Tag>;
  getPostTags(postId: number): Promise<Tag[]>;
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getAllPosts(): Promise<Post[]> {
    return await db.select().from(posts);
  }

  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async createPost(post: InsertPost & { userId: number }): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  async updatePost(id: number, post: InsertPost): Promise<Post | undefined> {
    const [updatedPost] = await db.update(posts).set(post).where(eq(posts.id, id)).returning();
    return updatedPost;
  }

  async deletePost(id: number): Promise<boolean> {
    const result = await db.delete(posts).where(eq(posts.id, id));
    return result.rowCount > 0;
  }

  async searchPosts(query: string): Promise<Post[]> {
    return await db.select().from(posts).where(
      or(
        sql`${posts.title} ILIKE ${`%${query}%`}`,
        sql`${posts.content} ILIKE ${`%${query}%`}`
      )
    );
  }

  async getPostComments(postId: number): Promise<Comment[]> {
    return await db.select().from(comments).where(eq(comments.postId, postId));
  }

  async createComment(comment: InsertComment & { userId: number }): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async deleteComment(id: number): Promise<boolean> {
    const result = await db.delete(comments).where(eq(comments.id, id));
    return result.rowCount > 0;
  }

  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async getAllTags(): Promise<Tag[]> {
    return await db.select().from(tags);
  }

  async getTag(id: number): Promise<Tag | undefined> {
    const [tag] = await db.select().from(tags).where(eq(tags.id, id));
    return tag;
  }

  async createTag(tag: InsertTag): Promise<Tag> {
    const [newTag] = await db.insert(tags).values(tag).returning();
    return newTag;
  }

  async getPostTags(postId: number): Promise<Tag[]> {
    return await db
      .select({
        id: tags.id,
        name: tags.name,
      })
      .from(postsTags)
      .innerJoin(tags, eq(tags.id, postsTags.tagId))
      .where(eq(postsTags.postId, postId));
  }
}

// Create and export database storage instance
export const storage = new DatabaseStorage();