import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { IsString, IsUrl } from 'class-validator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { SahibindenScraperService } from '../services/sahibinden-scraper.service';

class ScrapeUrlDto {
  @IsString()
  @IsUrl({ require_tld: true, require_protocol: true })
  url!: string;
}

@Controller('admin/sahibinden-import')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'consultant')
export class SahibindenImportController {
  constructor(private readonly scraper: SahibindenScraperService) {}

  /** POST /admin/sahibinden-import — scrape a sahibinden listing URL */
  @Post()
  async scrape(@Body() dto: ScrapeUrlDto) {
    return this.scraper.scrape(dto.url);
  }
}
