"use client";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CatalogSort({
  value,
  label,
  options,
}: {
  value: string;
  label: string;
  options: { value: string; label: string; href: string }[];
}) {
  const router = useRouter();
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        const option = options.find((item) => item.value === next);
        if (option) router.push(option.href);
      }}
    >
      <SelectTrigger aria-label={label} className="catalog-sort">
        <SelectValue>{options.find((option) => option.value === value)?.label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
