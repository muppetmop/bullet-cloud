import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface FloatingUserToggleProps {
  isYourBullets: boolean;
  onToggle: (checked: boolean) => void;
}

const FloatingUserToggle = ({ isYourBullets, onToggle }: FloatingUserToggleProps) => {
  return (
    <div className="fixed bottom-8 left-44 flex items-center gap-2 bg-white p-3 rounded-lg shadow-md">
      <Switch
        id="user-mode"
        checked={isYourBullets}
        onCheckedChange={onToggle}
      />
      <Label htmlFor="user-mode" className="text-sm text-gray-600">
        {isYourBullets ? "Yours" : "Others"}
      </Label>
    </div>
  );
};

export default FloatingUserToggle;