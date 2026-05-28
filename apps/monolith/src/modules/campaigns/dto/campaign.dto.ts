import {
  IsString, IsOptional, IsIn, IsISO8601, IsNumber, Min, Max,
  MaxLength, IsObject, IsArray, IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCampaignDto {
  @IsString() @MaxLength(500)
  title!: string;

  @IsOptional() @IsString()
  description?: string;

  @IsString() @MaxLength(50)
  campaignType!: string;

  @IsISO8601()
  startsAt!: string;

  @IsISO8601()
  endsAt!: string;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(100)
  discountPercent?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  discountAmount?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  maxUses?: number;

  @IsOptional() @IsObject()
  metadata?: Record<string, unknown>;
}

export class AddRuleDto {
  @IsString() @MaxLength(50)
  ruleType!: string;

  @IsObject()
  ruleValue!: Record<string, unknown>;
}

export class AssignParcelsDto {
  @IsArray() @IsUUID('4', { each: true })
  parcelIds!: string[];
}

export class UpdateCampaignDto {
  @IsOptional() @IsString() @MaxLength(500)
  title?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsIn(['draft', 'active', 'paused', 'expired', 'cancelled'])
  status?: string;

  @IsOptional() @IsISO8601()
  startsAt?: string;

  @IsOptional() @IsISO8601()
  endsAt?: string;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(100)
  discountPercent?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  discountAmount?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  maxUses?: number;

  @IsOptional() @IsObject()
  metadata?: Record<string, unknown>;
}
