import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { TkgmService } from '../services/tkgm.service';
import { TkgmLookupDto } from '../dto/tkgm-lookup.dto';

@Controller('integrations/tkgm')
export class TkgmController {
  constructor(private readonly tkgmService: TkgmService) {}

  /** Admin / consultant: full lookup (privileged) */
  @Post('lookup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'consultant')
  @HttpCode(HttpStatus.OK)
  async lookup(@Body() dto: TkgmLookupDto) {
    return this.safeLookup(dto);
  }

  /** Public: parsel boundary query — no auth required, cached */
  @Post('public-lookup')
  @HttpCode(HttpStatus.OK)
  async publicLookup(@Body() dto: TkgmLookupDto) {
    return this.safeLookup(dto);
  }

  /**
   * Wraps service.lookup() so that any TKGM upstream failure (network, parse,
   * il/ilçe not found) returns a soft "found:false" response instead of HTTP 500.
   * This lets the frontend show a clean message and the user retry.
   */
  private async safeLookup(dto: TkgmLookupDto) {
    try {
      return await this.tkgmService.lookup(dto);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'TKGM sorgusu başarısız';
      return {
        responseData: {
          source: 'tkgm',
          found: false,
          ada: dto.ada,
          parsel: dto.parsel,
          city: dto.city,
          district: dto.district,
          error: message,
          latitude: null,
          longitude: null,
          boundary: null,
          fetchedAt: new Date().toISOString(),
        },
      };
    }
  }
}
