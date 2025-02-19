import { useQuery } from "@tanstack/react-query";
import { type Category } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategorySelectProps {
  value?: number;
  onChange: (value: number | undefined) => void;
}

export default function CategorySelect({ value, onChange }: CategorySelectProps) {
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  if (isLoading) return null;

  return (
    <Select
      value={value?.toString()}
      onValueChange={(value) => onChange(value ? parseInt(value) : undefined)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select a category" />
      </SelectTrigger>
      <SelectContent>
        {categories?.map((category) => (
          <SelectItem key={category.id} value={category.id.toString()}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
