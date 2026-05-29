import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/auth.service';
import { SupportService } from '../services/support.service';
import {
  CreateSupportTicketDto,
  SendSupportMessageDto,
  CreateTicketFromContactDto,
  UpdateTicketStatusDto,
  AssignTicketDto,
} from '../dto/support.dto';

const UPLOAD_ROOT = process.env.UPLOADS_DIR || './uploads';
const SUPPORT_UPLOAD_DIR = path.join(UPLOAD_ROOT, 'support');
fs.mkdirSync(SUPPORT_UPLOAD_DIR, { recursive: true });

const supportFileStorage = diskStorage({
  destination: (_req, _file, cb) => cb(null, SUPPORT_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).slice(0, 10);
    const id = crypto.randomBytes(12).toString('hex');
    cb(null, `${id}${ext}`);
  },
});

// ─────────────────────────────────────────────────────────────────
//  USER-FACING ROUTES  (/support)
// ─────────────────────────────────────────────────────────────────

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly service: SupportService) {}

  @Post('tickets')
  @HttpCode(HttpStatus.CREATED)
  createTicket(@Body() dto: CreateSupportTicketDto, @CurrentUser() user: JwtPayload) {
    return this.service.createTicket(dto, user.sub);
  }

  @Get('tickets')
  list(@CurrentUser() user: JwtPayload) {
    return this.service.listTicketsForUser(user.sub);
  }

  @Get('unread-count')
  unread(@CurrentUser() user: JwtPayload) {
    return this.service.unreadCountForUser(user.sub).then((c) => ({ count: c }));
  }

  @Get('tickets/:id')
  get(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.service.getTicketForUser(id, user.sub);
  }

  @Post('tickets/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  send(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendSupportMessageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.sendMessageAsUser(id, dto, user.sub);
  }

  @Post('tickets/:id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markRead(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    await this.service.markReadAsUser(id, user.sub);
  }

  /**
   * Generic attachment upload — both user and admin endpoints route the
   * upload through here, get back a public URL, then attach it on the
   * subsequent /messages POST. Keeps the file IO out of the JSON body and
   * lets the FE show a preview before the message is sent.
   */
  @Post('attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: supportFileStorage,
      limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    }),
  )
  uploadAttachment(@UploadedFile() file: Express.Multer.File) {
    return {
      url: `/uploads/support/${file.filename}`,
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  }
}

// ─────────────────────────────────────────────────────────────────
//  ADMIN-FACING ROUTES  (/admin/support)
// ─────────────────────────────────────────────────────────────────

@Controller('admin/support')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin', 'consultant')
export class AdminSupportController {
  constructor(private readonly service: SupportService) {}

  @Get('tickets')
  list(@Query('status') status?: string, @Query('search') search?: string) {
    return this.service.listAllTickets({ status, search });
  }

  @Get('unread-count')
  unread() {
    return this.service.unreadCountForAdmin().then((c) => ({ count: c }));
  }

  @Get('tickets/:id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getTicketForAdmin(id);
  }

  @Post('tickets/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  send(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendSupportMessageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.sendMessageAsAdmin(id, dto, user.sub);
  }

  @Post('tickets/:id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markRead(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.markReadAsAdmin(id);
  }

  @Patch('tickets/:id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.updateStatus(id, dto, user.sub);
  }

  @Patch('tickets/:id/assign')
  assign(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignTicketDto) {
    return this.service.assignTicket(id, dto);
  }

  /**
   * Promote a /contact form submission (or a "DANIŞMAN BAŞVURUSU") into a
   * live-chat ticket. Returns the new ticket so the admin UI can redirect
   * straight to the conversation pane.
   */
  @Post('tickets/from-contact')
  @HttpCode(HttpStatus.CREATED)
  fromContact(@Body() dto: CreateTicketFromContactDto, @CurrentUser() user: JwtPayload) {
    return this.service.createFromContactRequest(dto, user.sub);
  }
}
