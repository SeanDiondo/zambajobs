import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

type DatePickerMode = "full" | "month-year" | "year";

interface PhilippineDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  mode?: DatePickerMode;
  placeholder?: string;
  disabled?: boolean;
  testId?: string;
}

export function PhilippineDatePicker({
  value,
  onChange,
  mode = "month-year",
  placeholder = "Select date",
  disabled = false,
  testId,
}: PhilippineDatePickerProps) {
  const [open, setOpen] = useState(false);
  
  // Parse value to Date
  const parseValue = (): Date | undefined => {
    if (!value) return undefined;
    
    if (mode === "year") {
      const year = parseInt(value);
      if (isNaN(year)) return undefined;
      return new Date(year, 0, 1);
    } else if (mode === "month-year") {
      const [year, month] = value.split('-');
      if (!year || !month) return undefined;
      return new Date(parseInt(year), parseInt(month) - 1, 1);
    } else {
      return new Date(value);
    }
  };
  
  // Format Date to string
  const formatValue = (date: Date | undefined): string => {
    if (!date) return "";
    
    if (mode === "year") {
      return String(date.getFullYear());
    } else if (mode === "month-year") {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    } else {
      return format(date, "yyyy-MM-dd");
    }
  };
  
  // Get display text
  const getDisplayText = (): string => {
    const date = parseValue();
    if (!date) return placeholder;
    
    if (mode === "year") {
      return String(date.getFullYear());
    } else if (mode === "month-year") {
      return format(date, "MMMM yyyy");
    } else {
      return format(date, "PPP");
    }
  };
  
  // Handle date selection
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(formatValue(date));
      if (mode !== "full") {
        setOpen(false);
      }
    }
  };
  
  // For year-only mode, show year selector
  if (mode === "year") {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
    
    return (
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={cn("justify-start text-left font-normal")} data-testid={testId}>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            <span className={cn(!value && "text-muted-foreground")}>
              {value || placeholder}
            </span>
          </div>
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={String(year)}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  
  // For full and month-year modes, show calendar
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal w-full",
            !value && "text-muted-foreground"
          )}
          disabled={disabled}
          data-testid={testId}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {getDisplayText()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={parseValue()}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
