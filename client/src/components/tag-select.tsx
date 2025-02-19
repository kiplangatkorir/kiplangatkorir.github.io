import { useQuery } from "@tanstack/react-query";
import { type Tag } from "@shared/schema";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface TagSelectProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

export default function TagSelect({ selectedIds, onChange }: TagSelectProps) {
  const { data: tags, isLoading } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
  });

  if (isLoading) return null;

  const selectedTags = tags?.filter((tag) => selectedIds.includes(tag.id)) || [];
  const availableTags = tags?.filter((tag) => !selectedIds.includes(tag.id)) || [];

  const handleSelect = (tagId: number) => {
    onChange([...selectedIds, tagId]);
  };

  const handleRemove = (tagId: number) => {
    onChange(selectedIds.filter((id) => id !== tagId));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <Badge key={tag.id} variant="secondary">
            {tag.name}
            <button
              className="ml-1 hover:text-destructive"
              onClick={() => handleRemove(tag.id)}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      
      <Command className="border rounded-md">
        <CommandInput placeholder="Search tags..." />
        <CommandEmpty>No tags found.</CommandEmpty>
        <CommandGroup>
          {availableTags.map((tag) => (
            <CommandItem
              key={tag.id}
              value={tag.name}
              onSelect={() => handleSelect(tag.id)}
            >
              {tag.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </Command>
    </div>
  );
}
