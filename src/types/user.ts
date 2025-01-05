export interface User {
  id: string;
  nom_de_plume: string;
  created_at: string;
  updated_at: string;
  bullets?: any[];
}

export interface UserWithBullets extends User {
  bullets: any[];
}