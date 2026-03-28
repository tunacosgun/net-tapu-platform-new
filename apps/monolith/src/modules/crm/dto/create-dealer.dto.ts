import { IsString, IsOptional, IsEmail, IsNumber, MaxLength, IsUUID } from 'class-validator';

export class CreateDealerDto {
  @IsEmail()
  email!: string;

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
