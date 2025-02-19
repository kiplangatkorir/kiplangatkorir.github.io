import { posts, comments, categories, tags, postsTags, type Post, type InsertPost, type Comment, type InsertComment, type Category, type InsertCategory, type Tag, type InsertTag } from "@shared/schema";
import { db } from "./db";
import { eq, or, sql, and } from "drizzle-orm";

export interface IStorage {
  // Post methods
  getAllPosts(): Promise<Post[]>;
  getPost(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, post: InsertPost): Promise<Post | undefined>;
  deletePost(id: number): Promise<boolean>;
  searchPosts(query: string): Promise<Post[]>;

  // Comment methods
  getPostComments(postId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
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

export class DatabaseStorage implements IStorage {
  // Existing post methods
  async getAllPosts(): Promise<Post[]> {
    return await db.select().from(posts).orderBy(posts.createdAt);
  }

  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const { tagIds, ...postData } = insertPost;
    const [post] = await db.insert(posts).values(postData).returning();

    if (tagIds && tagIds.length > 0) {
      await db.insert(postsTags).values(
        tagIds.map(tagId => ({ postId: post.id, tagId }))
      );
    }

    return post;
  }

  async updatePost(id: number, insertPost: InsertPost): Promise<Post | undefined> {
    const { tagIds, ...postData } = insertPost;

    // Update post
    const [post] = await db
      .update(posts)
      .set({ ...postData, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();

    if (!post) return undefined;

    // Update tags
    await db.delete(postsTags).where(eq(postsTags.postId, id));
    if (tagIds && tagIds.length > 0) {
      await db.insert(postsTags).values(
        tagIds.map(tagId => ({ postId: id, tagId }))
      );
    }

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

  // Existing comment methods
  async getPostComments(postId: number): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(comments.createdAt);
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db.insert(comments).values(insertComment).returning();
    return comment;
  }

  async deleteComment(id: number): Promise<boolean> {
    const [comment] = await db
      .delete(comments)
      .where(eq(comments.id, id))
      .returning();
    return !!comment;
  }

  // New category methods
  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  // New tag methods
  async getAllTags(): Promise<Tag[]> {
    return await db.select().from(tags).orderBy(tags.name);
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
        createdAt: tags.createdAt,
      })
      .from(postsTags)
      .innerJoin(tags, eq(postsTags.tagId, tags.id))
      .where(eq(postsTags.postId, postId));
  }
}

export const storage = new DatabaseStorage();