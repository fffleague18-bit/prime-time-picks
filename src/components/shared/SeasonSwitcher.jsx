import React from "react";
import { useSeason } from "@/lib/SeasonContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";

export default function SeasonSwitcher() {
  const { seasons, currentSeason, changeSeason } = useSeason();

  if (seasons.length === 0) return null;

  return (
    <div className="px-3 py-2">
      <p className="text-sm font-semibold text-slate-500 mb-2">Season</p>
      <Select value={currentSeason} onValueChange={changeSeason}>
        <SelectTrigger className="w-full">
          <Calendar className="w-4 h-4 mr-2 shrink-0" />
          <SelectValue placeholder="Select season" />
        </SelectTrigger>
        <SelectContent>
          {seasons.map((s) => (
            <SelectItem key={s.id} value={s.name}>
              {s.name} {s.is_active && "★"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}