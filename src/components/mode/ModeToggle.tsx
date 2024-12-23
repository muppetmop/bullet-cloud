import { Toggle } from "@/components/ui/toggle";
import { BookOpen } from "lucide-react";

interface ModeToggleProps {
  mode: "yours" | "theirs";
  onModeChange: (mode: "yours" | "theirs") => void;
}

const ModeToggle = ({ mode, onModeChange }: ModeToggleProps) => {
  return (
    <div className="flex items-center gap-2 mb-8">
      <Toggle
        pressed={mode === "yours"}
        onPressedChange={() => onModeChange("yours")}
        className="px-3 py-2 hover:bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-black text-gray-400 hover:text-black transition-colors"
        variant="outline"
      >
        <BookOpen className="w-4 h-4 mr-2" />
        Yours
      </Toggle>
      <Toggle
        pressed={mode === "theirs"}
        onPressedChange={() => onModeChange("theirs")}
        className="px-3 py-2 hover:bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-black text-gray-400 hover:text-black transition-colors"
        variant="outline"
      >
        <div className="relative mr-2">
          <BookOpen className="w-5 h-5 absolute -right-0.5 -top-0.5 opacity-50" />
          <BookOpen className="w-4 h-4 relative z-10" />
        </div>
        Theirs
      </Toggle>
    </div>
  );
};

export default ModeToggle;