import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/auth.service';
import { AuditInterceptor } from '../interceptors/audit.interceptor';
import { AdminBroadcastService } from '../services/admin-broadcast.service';
import { IsArray, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

class BroadcastDto {
  @IsString() @MaxLength(500)
  subject!: string;

  @IsString() @MaxLength(5000)
  message!: string;

  @IsArray() @IsString({ each: true })
  channels!: string[];

  @IsIn(['all', 'verified', 'specific'])
  audience!: string;

  @IsOptional() @IsUUID()
  targetUserId?: string;
}

@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@UseInterceptors(AuditInterceptor)
export class AdminNotificationController {
  constructor(private readonly broadcastService: AdminBroadcastService) {}

  /**
   * POST /admin/notifications/broadcast — Send notification to users
   */
  @Post('broadcast')
  @HttpCode(HttpStatus.OK)
  async broadcast(
    @Body() dto: BroadcastDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.broadcastService.broadcast(dto, user.sub);
  }
}
