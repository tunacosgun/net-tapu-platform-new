import {
  IsString,
  IsOptional,
  IsUUID,
  IsIn,
  MaxLength,
  IsEmail,
} from 'class-validator';

export class CreateSupportTicketDto {
  @IsString()
  @MaxLength(500)
  subject!: string;

  /** First message body. Empty string allowed when there's only an attachment. */
  @IsString()
  @IsOptional()
  initialMessage?: string;

  @IsOptional()
  @IsIn(['direct', 'parcel_inquiry'])
  source?: 'direct' | 'parcel_inquiry';

  @IsOptional()
  @IsUUID()
  parcelId?: string;
}

export class SendSupportMessageDto {
  @IsString()
  @IsOptional()
  @MaxLength(10000)
  body?: string;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  @IsString()
  @IsOptional()
  attachmentType?: string;

  @IsString()
  @IsOptional()
  attachmentName?: string;
}

export class UpdateTicketStatusDto {
  @IsIn(['open', 'in_progress', 'waiting_user', 'closed'])
  status!: 'open' | 'in_progress' | 'waiting_user' | 'closed';
}

export class AssignTicketDto {
  @IsOptional()
  @IsUUID()
  assignedTo?: string | null;
}

export class CreateTicketFromContactDto {
  @IsUUID()
  contactRequestId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  subject?: string;

  @IsOptional()
  @IsString()
  greeting?: string;
}
