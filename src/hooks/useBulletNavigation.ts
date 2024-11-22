import { BulletPoint } from "@/types/bullet";

export const useBulletNavigation = (
  getAllVisibleBullets: (bullets: BulletPoint[]) => BulletPoint[],
  bullets: BulletPoint[]
) => {
  const handleNavigate = (direction: "up" | "down", currentId: string) => {
    const visibleBullets = getAllVisibleBullets(bullets);
    const currentIndex = visibleBullets.findIndex((b) => b.id === currentId);
    
    let nextBullet: BulletPoint | undefined;
    
    if (direction === "up") {
      nextBullet = visibleBullets[currentIndex - 1];
    } else if (direction === "down") {
      if (currentIndex === visibleBullets.length - 1) {
        const plusButton = document.querySelector(".new-bullet-button") as HTMLElement;
        if (plusButton) {
          plusButton.focus();
          return;
        }
      }
      nextBullet = visibleBullets[currentIndex + 1];
    }

    if (nextBullet) {
      const nextElement = document.querySelector(
        `[data-id="${nextBullet.id}"] .bullet-content`
      ) as HTMLElement;
      if (nextElement) {
        nextElement.focus();
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(nextElement);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  };

  return { handleNavigate };
};