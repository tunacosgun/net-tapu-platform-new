import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  IsIn,
  MaxLength,
  Length,
  IsNumberString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateParcelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  district!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  neighborhood?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumberString()
  @IsOptional()
  latitude?: string;

  @IsNumberString()
  @IsOptional()
  longitude?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  ada?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  parsel?: string;

  @IsNumberString()
  @IsOptional()
  areaM2?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  zoningStatus?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  landType?: string;

  @IsNumberString()
  @IsOptional()
  price?: string;

  @IsString()
  @Length(3, 3)
  @IsOptional()
  currency?: string;

  @IsBoolean()
  @IsOptional()
  isAuctionEligible?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsBoolean()
  @IsOptional()
  showListingDate?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  deedType?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  vatRate?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  roadAccess?: string;

  @IsBoolean()
  @IsOptional()
  isCornerParcel?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  videoUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  embedCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  guideUrl?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  paftaNo?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  kaksEmsal?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  gabari?: string;

  @IsBoolean()
  @IsOptional()
  creditEligible?: boolean | null;

  @IsString()
  @IsOptional()
  @IsIn(['sahibinden', 'emlakcidan', 'danisman'])
  sellerType?: string;

  @IsBoolean()
  @IsOptional()
  tradeAccepted?: boolean | null;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  hiddenFields?: string[];
}
