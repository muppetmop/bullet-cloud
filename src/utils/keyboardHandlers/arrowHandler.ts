import { BulletPoint } from "@/types/bullet";

export const handleArrowKeys = (
  e: React.KeyboardEvent,
  content: string,
  bullet: BulletPoint,
  onUpdate: (id: string, content: string) => void,
  onNavigate: (direction: "up" | "down", id: string) => void
) => {
  e.preventDefault();
  
  console.log('Arrow key pressed:', {
    direction: e.key === "ArrowUp" ? "up" : "down",
    bullet: {
      id: bullet.id,
      content,
      position: bullet.position
    }
  });
  
  onUpdate(bullet.id, content);
  onNavigate(e.key === "ArrowUp" ? "up" : "down", bullet.id);
};