import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  return (
    <Tabs defaultValue="edit">
      <TabsList className="mb-2">
        <TabsTrigger value="edit">Edit</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>
      <TabsContent value="edit">
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
