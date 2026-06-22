import type { User } from "./user";

export interface TeamMember {
  user: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    role: string;
  };
  role: "admin" | "member";
}

export interface Team {
  _id: string;
  name: string;
  owner: User;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

export interface InvitePayload {
  email: string;
//   teamId: string
}