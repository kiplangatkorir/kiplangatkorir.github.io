import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Editor } from '@tinymce/tinymce-react';

interface StoryEditorProps {
  initialData?: {
    id?: number;
    title?: string;
    subtitle?: string;
    content?: string;
    coverImageUrl?: string;
    published?: boolean;
  };
}

export function StoryEditor({ initialData }: StoryEditorProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    subtitle: initialData?.subtitle || '',
    content: initialData?.content || '',
    coverImageUrl: initialData?.coverImageUrl || '',
    published: initialData?.published || false,
  });
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(formData.coverImageUrl);
  const editorRef = useRef<any>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.url;
  };

  const handleSubmit = async (publish: boolean = false) => {
    try {
      setIsSubmitting(true);

      let coverImageUrl = formData.coverImageUrl;
      if (coverImageFile) {
        coverImageUrl = await uploadImage(coverImageFile);
      }

      const content = editorRef.current?.getContent();
      const wordCount = content.split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200); // Assuming 200 words per minute

      const postData = {
        ...formData,
        content,
        coverImageUrl,
        published: publish,
        readingTime,
      };

      const method = initialData?.id ? 'PUT' : 'POST';
      const url = initialData?.id ? `/api/posts/${initialData.id}` : '/api/posts';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error('Failed to save post');
      }

      const savedPost = await response.json();

      toast({
        title: publish ? "Story published!" : "Draft saved!",
        description: "Your story has been successfully saved.",
      });

      navigate(`/posts/${savedPost.id}`);
    } catch (error) {
      console.error('Error saving post:', error);
      toast({
        title: "Error",
        description: "Failed to save your story. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{initialData?.id ? 'Edit Story' : 'Write a Story'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="coverImage">Cover Image</Label>
            <div className="relative">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Cover preview"
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
              )}
              <Input
                id="coverImage"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="mt-2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter your story title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle (optional)</Label>
            <Input
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="Add a subtitle to your story"
            />
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <Editor
              onInit={(evt, editor) => editorRef.current = editor}
              initialValue={formData.content}
              init={{
                height: 500,
                menubar: false,
                plugins: [
                  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                  'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                  'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                ],
                toolbar: 'undo redo | blocks | ' +
                  'bold italic forecolor | alignleft aligncenter ' +
                  'alignright alignjustify | bullist numlist outdent indent | ' +
                  'removeformat | help',
                content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 16px; line-height: 1.6; }',
              }}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
          >
            Save Draft
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
          >
            Publish
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
