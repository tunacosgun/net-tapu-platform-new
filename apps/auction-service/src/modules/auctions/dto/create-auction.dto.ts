import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsInt,
  IsIn,
  Min,
  Max,
  MaxLength,
  Length,
} from 'class-validator';

export class CreateAuctionDto {
  /**
   * Publication state at creation time.
   * - 'scheduled' : auction is announced & visible immediately, bidding opens at startTime (default)
   * - 'draft'     : saved but hidden from the public list until manually published
   */
  @IsOptional()
  @IsIn(['draft', 'scheduled'])
  status?: 'draft' | 'scheduled';

  @IsUUID()
  parcelId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsDateString()
  depositDeadline!: string;

  @IsString()
  @IsNotEmpty()
  startingPrice!: string;

  @IsString()
  @IsNotEmpty()
  minimumIncrement!: string;

  @IsString()
  @IsNotEmpty()
  requiredDeposit!: string;

  @IsString()
  @Length(3, 3)
  @IsOptional()
  currency?: string;

  // Anti-sniping configuration
  @IsOptional()
  @IsBoolean()
  sniperEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(600)
  sniperWindowSeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(600)
  sniperExtensionSeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  maxSniperExtensions?: number;
}
