import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ImagePlus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useRef } from "react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const { url } = await response.json();
      const imageMarkdown = `![${file.name}](${url})`;

      // Insert the image markdown at cursor position or at the end
      const textarea = document.querySelector("textarea");
      const cursorPosition = textarea?.selectionStart ?? value.length;
      const newValue = value.slice(0, cursorPosition) + 
                      "\n" + imageMarkdown + "\n" + 
                      value.slice(cursorPosition);

      onChange(newValue);
    } catch (error) {
      console.error("Failed to upload image:", error);
    }
  };

  return (
    <Tabs defaultValue="edit">
      <TabsList className="mb-2">
        <TabsTrigger value="edit">Edit</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>
      <TabsContent value="edit" className="space-y-2">
        <div className="flex justify-end">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4 mr-2" />
            Add Image
          </Button>
        </div>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[400px] font-mono"
          placeholder="Write your post content in Markdown..."
        />
      </TabsContent>
      <TabsContent value="preview">
        <div className="prose max-w-none min-h-[400px] p-4 border rounded-md">
          <ReactMarkdown>{value}</ReactMarkdown>
        </div>
      </TabsContent>
    </Tabs>
  );
}