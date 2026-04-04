import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';
import { NotificationEventDto } from './dto/notification-event.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  /** User inbox: recent sent notifications from the dispatch queue */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getMyNotifications(
    @Request() req: any,
    @Query('limit') limit = '20',
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const userId: string = req.user.sub ?? req.user.id ?? req.user.userId;
    const notifications = await this.notificationService.getUserNotifications(
      userId,
      Number(limit) || 20,
    );
    return { data: notifications, total: notifications.length };
  }

  @Post('events')
  @Throttle({ short: { ttl: 1000, limit: 50 } })
  @HttpCode(HttpStatus.ACCEPTED)
  async handleEvent(@Body() dto: NotificationEventDto) {
    await this.notificationService.handleEvent(
      dto.event,
      dto.userId,
      dto.metadata,
    );
    return { queued: true };
  }
}
