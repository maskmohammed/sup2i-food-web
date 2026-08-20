import type { Role } from "@/lib/roles";

export type StaffUser = {
  id: string;
  name: string;
  role: Role;
  active: boolean;
  createdAt: string;
};

export type AuditLogEntry = {
  id: string;
  actorName: string;
  actorRole: Role;
  action: string;
  details: string;
  timestamp: string;
};
