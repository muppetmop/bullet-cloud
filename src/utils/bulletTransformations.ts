import { BulletPoint } from "@/types/bullet";

export const transformUserBullets = (
  bullet: any,
  baseLevel: number = 0
): BulletPoint => {
  console.log('Transforming bullet:', {
    id: bullet.id,
    content: bullet.content,
    originalLevel: bullet.level,
    newLevel: (bullet.level || 0) + baseLevel,
    baseLevel,
    children: bullet.children?.length || 0
  });

  return {
    ...bullet,
    isCollapsed: bullet.isCollapsed || false,
    position: bullet.position || 0,
    level: (bullet.level || 0) + baseLevel,
    children: (bullet.children || []).map((child: any) => 
      transformUserBullets(child, baseLevel + 1)
    )
  };
};

export const transformUserToRootBullet = (user: any): BulletPoint => {
  console.log('Transforming user to root bullet:', {
    userId: user.id,
    nomDePlume: user.nom_de_plume,
    bulletCount: user.bullets?.length || 0
  });

  return {
    id: user.id,
    content: `📖 ${user.nom_de_plume}`,
    children: user.bullets.map((bullet: any) => 
      transformUserBullets(bullet, 1) // Start user's bullets at level 1
    ),
    isCollapsed: false,
    position: 0,
    level: 0
  };
};