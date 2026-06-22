export type UserRole = 'admin' | 'member' | 'user' | 'guest';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  teamId?: string;
  avatarUrl?: string;
  bio?: string;
  oauthProvider?: string;
  oauthId?: string;
  tokenVersion?: number; 
}
