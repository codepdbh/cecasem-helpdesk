import { TicketPriority } from '@prisma/client';
import { IsEnum, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @MinLength(4)
  @MaxLength(160)
  title!: string;

  @IsUUID()
  categoryId!: string;

  @IsEnum(TicketPriority)
  priority!: TicketPriority;

  @IsString()
  @MinLength(4)
  priorityJustification!: string;

  @IsString()
  @MinLength(4)
  reason!: string;

  @IsString()
  @MinLength(4)
  purpose!: string;

  @IsString()
  @MinLength(8)
  description!: string;
}

