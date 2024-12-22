import { BulletPoint } from "@/types/bullet";

export const transformUserBullets = (
  bullet: any,
  baseLevel: number = 0
): BulletPoint => ({
  ...bullet,
  isCollapsed: bullet.isCollapsed || false,
  position: bullet.position || 0,
  level: (bullet.level || 0) + baseLevel,
  children: (bullet.children || []).map((child: any) => 
    transformUserBullets(child, baseLevel + 1)
  )
});

export const transformUserToRootBullet = (user: any): BulletPoint => ({
  id: user.id,
  content: `📖 ${user.nom_de_plume}`,
  children: user.bullets.map((bullet: any) => 
    transformUserBullets(bullet, 1) // Start user's bullets at level 1
  ),
  isCollapsed: false,
  position: 0,
  level: 0
});