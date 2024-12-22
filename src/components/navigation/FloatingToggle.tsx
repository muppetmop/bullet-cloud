import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface FloatingToggleProps {
  isWriteMode: boolean;
  onToggle: (checked: boolean) => void;
}

const FloatingToggle = ({ isWriteMode, onToggle }: FloatingToggleProps) => {
  return (
    <div className="fixed bottom-8 left-8 flex items-center gap-2 bg-white p-3 rounded-lg shadow-md">
      <Switch
        id="write-mode"
        checked={isWriteMode}
        onCheckedChange={onToggle}
      />
      <Label htmlFor="write-mode" className="text-sm text-gray-600">
        {isWriteMode ? "Write" : "Read"}
      </Label>
    </div>
  );
};

export default FloatingToggle;