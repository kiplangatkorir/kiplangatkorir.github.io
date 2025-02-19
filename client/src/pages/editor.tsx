import { useEffect } from "react";
import { useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPostSchema, type InsertPost, type Post } from "@shared/schema";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MarkdownEditor from "@/components/markdown-editor";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

export default function Editor() {
  const [, params] = useRoute<{ id: string }>("/edit/:id");
  const { toast } = useToast();
  const isEditing = Boolean(params?.id);

  const { data: existingPost } = useQuery<Post>({
    queryKey: isEditing ? [`/api/posts/${params?.id}`] : null,
  });

  const form = useForm<InsertPost>({
    resolver: zodResolver(insertPostSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  useEffect(() => {
    if (existingPost) {
      form.reset(existingPost);
    }
  }, [existingPost, form]);

  const onSubmit = async (data: InsertPost) => {
    try {
      if (isEditing) {
        await apiRequest("PUT", `/api/posts/${params?.id}`, data);
      } else {
        await apiRequest("POST", "/api/posts", data);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: `Post ${isEditing ? "updated" : "created"} successfully` });
      window.location.href = "/";
    } catch (error) {
      toast({
        title: `Failed to ${isEditing ? "update" : "create"} post`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">
        {isEditing ? "Edit Post" : "New Post"}
      </h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input {...form.register("title")} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <MarkdownEditor
              value={form.watch("content")}
              onChange={(value) => form.setValue("content", value)}
            />
          </div>
          <Button type="submit">
            {isEditing ? "Update Post" : "Create Post"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
