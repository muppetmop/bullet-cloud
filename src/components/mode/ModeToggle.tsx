import { Toggle } from "@/components/ui/toggle";
import { BookOpen, Users } from "lucide-react";

interface ModeToggleProps {
  mode: "yours" | "theirs";
  onModeChange: (mode: "yours" | "theirs") => void;
}

const ModeToggle = ({ mode, onModeChange }: ModeToggleProps) => {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white shadow-sm rounded-lg border">
      <div className="flex items-center">
        <Toggle
          pressed={mode === "yours"}
          onPressedChange={() => onModeChange("yours")}
          className="px-4 data-[state=on]:bg-[#9b87f5] data-[state=on]:text-white"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Yours
        </Toggle>
        <Toggle
          pressed={mode === "theirs"}
          onPressedChange={() => onModeChange("theirs")}
          className="px-4 data-[state=on]:bg-[#9b87f5] data-[state=on]:text-white"
        >
          <Users className="w-4 h-4 mr-2" />
          Theirs
        </Toggle>
      </div>
    </div>
  );
};

export default ModeToggle;