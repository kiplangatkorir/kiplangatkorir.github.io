import { posts, type Post, type InsertPost } from "@shared/schema";
import { db } from "./db";
import { eq, or, sql } from "drizzle-orm";

export interface IStorage {
  getAllPosts(): Promise<Post[]>;
  getPost(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, post: InsertPost): Promise<Post | undefined>;
  deletePost(id: number): Promise<boolean>;
  searchPosts(query: string): Promise<Post[]>;
}

export class DatabaseStorage implements IStorage {
  async getAllPosts(): Promise<Post[]> {
    return await db.select().from(posts).orderBy(posts.createdAt);
  }

  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db.insert(posts).values(insertPost).returning();
    return post;
  }

  async updatePost(id: number, insertPost: InsertPost): Promise<Post | undefined> {
    const [post] = await db
      .update(posts)
      .set({ ...insertPost, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return post;
  }

  async deletePost(id: number): Promise<boolean> {
    const [post] = await db.delete(posts).where(eq(posts.id, id)).returning();
    return !!post;
  }

  async searchPosts(query: string): Promise<Post[]> {
    const lowercaseQuery = query.toLowerCase();
    return await db
      .select()
      .from(posts)
      .where(
        or(
          sql`lower(${posts.title}) like ${`%${lowercaseQuery}%`}`,
          sql`lower(${posts.content}) like ${`%${lowercaseQuery}%`}`
        )
      )
      .orderBy(posts.createdAt);
  }
}

export const storage = new DatabaseStorage();