export type Role = 'SUPERADMIN' | 'USER';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'DISABLED';
export type TicketStatus =
  | 'ABIERTO'
  | 'EN_PROCESO'
  | 'ESPERANDO_USUARIO'
  | 'RESUELTO'
  | 'CERRADO'
  | 'REABIERTO'
  | 'CANCELADO';
export type Priority = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  username: string;
  email?: string;
  phone?: string;
  area?: string;
  position?: string;
  profilePhotoPath?: string;
  role: Role;
  status: UserStatus;
  isActive: boolean;
  mustChangePassword: boolean;
  firstAccessIp?: string;
  firstAccessUserAgent?: string;
  firstAccessAt?: string;
  lastLoginIp?: string;
  lastLoginUserAgent?: string;
  lastLoginAt?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface TicketAttachment {
  id: string;
  originalName: string;
  filePath: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt: string;
}

export interface ConstancyPhoto extends TicketAttachment {
  description?: string;
  uploadedFromIp: string;
  uploadedBy?: Pick<User, 'fullName' | 'profilePhotoPath'>;
}

export interface TicketComment {
  id: string;
  comment: string;
  createdFromIp: string;
  createdAt: string;
  user: Pick<User, 'fullName' | 'profilePhotoPath' | 'role'>;
}

export interface TicketLog {
  id: string;
  action: string;
  previousValue?: string;
  newValue?: string;
  ipAddress?: string;
  createdAt: string;
  user?: Pick<User, 'fullName'>;
}

export interface Ticket {
  id: string;
  code: string;
  title: string;
  description: string;
  reason: string;
  purpose: string;
  priority: Priority;
  priorityJustification: string;
  status: TicketStatus;
  category: Category;
  createdBy: User;
  assignedTo?: User;
  closedBy?: Pick<User, 'id' | 'fullName'>;
  resolvedBy?: Pick<User, 'id' | 'fullName'>;
  createdFromIp: string;
  createdUserAgent: string;
  closedAt?: string;
  closeComment?: string;
  createdAt: string;
  updatedAt: string;
  attachments: TicketAttachment[];
  constancyPhotos: ConstancyPhoto[];
  comments: TicketComment[];
  logs: TicketLog[];
}

export interface Paged<T> {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface Summary {
  totalTickets: number;
  openTickets: number;
  processingTickets: number;
  criticalTickets: number;
  closedToday: number;
  withConstancy: number;
  withoutConstancy: number;
  users: number;
  pendingUsers: number;
  averageResolutionHours: number;
  byStatus: Array<{ status: TicketStatus; _count: number }>;
  byPriority: Array<{ priority: Priority; _count: number }>;
}
