import { TicketStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class ChangeStatusDto {
  @IsEnum(TicketStatus)
  status!: TicketStatus;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class AssignTicketDto {
  @IsUUID()
  assignedToId!: string;
}

export class ResolveTicketDto {
  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  constancyDescription?: string;
}

export class CloseTicketDto {
  @IsString()
  @MinLength(3)
  closeComment!: string;

  @IsOptional()
  @IsString()
  constancyDescription?: string;
}

export class ReopenTicketDto {
  @IsString()
  @MinLength(4)
  reason!: string;
}

