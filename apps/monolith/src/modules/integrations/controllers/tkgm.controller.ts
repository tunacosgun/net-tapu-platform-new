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
    return this.tkgmService.lookup(dto);
  }

  /** Public: parsel boundary query — no auth required, cached */
  @Post('public-lookup')
  @HttpCode(HttpStatus.OK)
  async publicLookup(@Body() dto: TkgmLookupDto) {
    return this.tkgmService.lookup(dto);
  }
}
