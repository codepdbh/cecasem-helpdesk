import { TicketPriority } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

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

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  reason?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  purpose?: string;

  @IsString()
  @MinLength(8)
  description!: string;
}
