import { IsString, IsOptional, IsEmail, IsNumber, MaxLength, IsUUID, IsEnum } from 'class-validator';

export class UpdateDealerDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsNumber()
  @IsOptional()
  commissionRate?: number;

  @IsUUID()
  @IsOptional()
  userId?: string;
}

export class UpdateDealerStatusDto {
  @IsEnum(['active', 'inactive', 'pending'])
  status!: string;
}
