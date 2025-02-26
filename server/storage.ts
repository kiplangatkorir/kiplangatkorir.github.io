import { users, posts, comments, categories, tags, postsTags, type User, type InsertUser, type Post, type InsertPost, type Comment, type InsertComment, type Category, type InsertCategory, type Tag, type InsertTag, type Follow, type Clap } from "@shared/schema";
import { db } from "./db";
import { eq, or, sql, and, desc } from "drizzle-orm";
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
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;

  // Post methods
  getAllPosts(): Promise<Post[]>;
  getPost(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost & { userId: number }): Promise<Post>;
  updatePost(id: number, post: InsertPost): Promise<Post | undefined>;
  deletePost(id: number): Promise<boolean>;
  searchPosts(query: string): Promise<Post[]>;
  getPostWithDetails(id: number): Promise<Post & { clapsCount: number; author: User } | undefined>;
  getFeaturedPosts(): Promise<Post[]>;

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

  // Follow methods
  createFollow(follow: { followerId: number; followingId: number }): Promise<Follow>;
  deleteFollow(followerId: number, followingId: number): Promise<boolean>;
  getFollowers(userId: number): Promise<User[]>;
  getFollowing(userId: number): Promise<User[]>;

  // Clap methods
  createOrUpdateClap(clap: { userId: number; postId: number; count?: number }): Promise<Clap>;
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async getAllPosts(): Promise<Post[]> {
    return await db.select().from(posts);
  }

  async getPost(id: number): Promise<Post | undefined> {
    const result = await db.select().from(posts).where(eq(posts.id, id));
    return result[0];
  }

  async createPost(post: InsertPost & { userId: number }): Promise<Post> {
    const result = await db.insert(posts).values(post).returning();
    return result[0];
  }

  async updatePost(id: number, post: InsertPost): Promise<Post | undefined> {
    const result = await db.update(posts).set(post).where(eq(posts.id, id)).returning();
    return result[0];
  }

  async deletePost(id: number): Promise<boolean> {
    const result = await db.delete(posts).where(eq(posts.id, id)).returning();
    return result.length > 0;
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
    const result = await db.insert(comments).values(comment).returning();
    return result[0];
  }

  async deleteComment(id: number): Promise<boolean> {
    const result = await db.delete(comments).where(eq(comments.id, id)).returning();
    return result.length > 0;
  }

  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.id, id));
    return result[0];
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(category).returning();
    return result[0];
  }

  async getAllTags(): Promise<Tag[]> {
    return await db.select().from(tags);
  }

  async getTag(id: number): Promise<Tag | undefined> {
    const result = await db.select().from(tags).where(eq(tags.id, id));
    return result[0];
  }

  async createTag(tag: InsertTag): Promise<Tag> {
    const result = await db.insert(tags).values(tag).returning();
    return result[0];
  }

  async getPostTags(postId: number): Promise<Tag[]> {
    return await db
      .select({
        id: tags.id,
        name: tags.name,
        createdAt: tags.createdAt,
      })
      .from(postsTags)
      .innerJoin(tags, eq(tags.id, postsTags.tagId))
      .where(eq(postsTags.postId, postId));
  }

  async createFollow(follow: { followerId: number; followingId: number }): Promise<Follow> {
    const result = await db.insert(follows).values(follow).returning();
    return result[0];
  }

  async deleteFollow(followerId: number, followingId: number): Promise<boolean> {
    const result = await db.delete(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ));
    return result.rowCount > 0;
  }

  async getFollowers(userId: number): Promise<User[]> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        bio: users.bio,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
      })
      .from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followingId, userId));
    return result;
  }

  async getFollowing(userId: number): Promise<User[]> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        bio: users.bio,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
      })
      .from(follows)
      .innerJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId));
    return result;
  }

  async createOrUpdateClap(clap: { userId: number; postId: number; count?: number }): Promise<Clap> {
    const existingClap = await db
      .select()
      .from(claps)
      .where(and(
        eq(claps.userId, clap.userId),
        eq(claps.postId, clap.postId)
      ));

    if (existingClap.length > 0) {
      const newCount = (existingClap[0].count || 0) + (clap.count || 1);
      const result = await db.update(claps)
        .set({ count: newCount, updatedAt: new Date() })
        .where(and(
          eq(claps.userId, clap.userId),
          eq(claps.postId, clap.postId)
        ))
        .returning();
      return result[0];
    }

    const result = await db.insert(claps)
      .values({
        userId: clap.userId,
        postId: clap.postId,
        count: clap.count || 1,
      })
      .returning();
    return result[0];
  }

  async getFeaturedPosts(): Promise<Post[]> {
    return db
      .select()
      .from(posts)
      .where(and(
        eq(posts.published, true),
        sql`${posts.featuredAt} IS NOT NULL`
      ))
      .orderBy(desc(posts.featuredAt))
      .limit(10);
  }

  async getPostWithDetails(id: number): Promise<Post & { clapsCount: number; author: User } | undefined> {
    const result = await db
      .select({
        ...posts,
        clapsCount: sql<number>`COALESCE(SUM(${claps.count}), 0)`,
        author: users,
      })
      .from(posts)
      .leftJoin(claps, eq(posts.id, claps.postId))
      .innerJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.id, id))
      .groupBy(posts.id, users.id);
    
    return result[0];
  }
}

// Create and export database storage instance
export const storage = new DatabaseStorage();