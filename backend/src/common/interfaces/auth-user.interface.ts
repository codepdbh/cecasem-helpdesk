import { UserRole, UserStatus } from '@prisma/client';

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  username: string;
  profilePhotoPath: string | null;
  role: UserRole;
  status: UserStatus;
  isActive: boolean;
  mustChangePassword: boolean;
  firstAccessIp: string | null;
}

