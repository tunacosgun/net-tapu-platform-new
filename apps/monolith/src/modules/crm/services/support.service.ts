import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, IsNull } from 'typeorm';
import { SupportTicket } from '../entities/support-ticket.entity';
import { SupportMessage } from '../entities/support-message.entity';
import { ContactRequest } from '../entities/contact-request.entity';
import { Parcel } from '../../listings/entities/parcel.entity';
import { NotificationService } from '../../notifications/notification.service';
import {
  CreateSupportTicketDto,
  SendSupportMessageDto,
  CreateTicketFromContactDto,
  UpdateTicketStatusDto,
  AssignTicketDto,
} from '../dto/support.dto';

/**
 * Live-chat support tickets.
 *
 * Tickets fall into three buckets:
 *   - direct                  : user opened a chat from /profile/support
 *   - contact                 : admin promoted a /contact form submission
 *   - consultant_application  : admin promoted a "DANIŞMAN BAŞVURUSU" submission
 *   - parcel_inquiry          : user clicked "İletişime Geç" on a parcel
 *
 * Unread counts are split per-side (unread_admin = messages from user the
 * admin team hasn't read; unread_user = admin replies the user hasn't seen).
 */
@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    @InjectRepository(SupportTicket)
    private readonly ticketRepo: Repository<SupportTicket>,
    @InjectRepository(SupportMessage)
    private readonly messageRepo: Repository<SupportMessage>,
    @InjectRepository(ContactRequest)
    private readonly contactRepo: Repository<ContactRequest>,
    @InjectRepository(Parcel)
    private readonly parcelRepo: Repository<Parcel>,
    private readonly dataSource: DataSource,
    private readonly notifications: NotificationService,
  ) {}

  // ── User-facing actions ────────────────────────────────────────────────

  async createTicket(dto: CreateSupportTicketDto, userId: string): Promise<SupportTicket> {
    if (!dto.subject?.trim()) {
      throw new BadRequestException('Konu boş bırakılamaz');
    }
    const now = new Date();
    const initialBody = dto.initialMessage?.trim() || null;
    const ticket = this.ticketRepo.create({
      userId,
      subject: dto.subject.trim().slice(0, 500),
      status: 'open',
      source: dto.source || 'direct',
      parcelId: dto.parcelId || null,
      unreadAdmin: initialBody ? 1 : 0,
      unreadUser: 0,
      lastMessageAt: initialBody ? now : null,
    });
    const saved = await this.ticketRepo.save(ticket);
    if (initialBody) {
      await this.messageRepo.save(
        this.messageRepo.create({
          ticketId: saved.id,
          senderId: userId,
          senderRole: 'user',
          body: initialBody,
        }),
      );
      this.fanOutNewMessageNotification(saved, 'admin', initialBody).catch(() => undefined);
    }
    this.logger.log(`Ticket ${saved.id} opened by user ${userId} (source=${saved.source})`);
    return saved;
  }

  async listTicketsForUser(userId: string) {
    return this.ticketRepo.find({
      where: { userId },
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async getTicketForUser(ticketId: string, userId: string) {
    const t = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!t) throw new NotFoundException('Talep bulunamadı');
    if (t.userId !== userId) {
      throw new ForbiddenException('Bu talebe erişim izniniz yok');
    }
    const messages = await this.messageRepo.find({
      where: { ticketId },
      order: { createdAt: 'ASC' },
    });
    return { ticket: t, messages };
  }

  async sendMessageAsUser(ticketId: string, dto: SendSupportMessageDto, userId: string) {
    const t = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!t) throw new NotFoundException('Talep bulunamadı');
    if (t.userId !== userId) throw new ForbiddenException('Bu talebe erişim izniniz yok');
    if (t.status === 'closed') {
      throw new BadRequestException('Kapatılmış talebe mesaj gönderilemez');
    }
    return this.appendMessage(t, dto, 'user', userId);
  }

  async markReadAsUser(ticketId: string, userId: string): Promise<void> {
    const t = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!t) throw new NotFoundException('Talep bulunamadı');
    if (t.userId !== userId) throw new ForbiddenException();
    await this.messageRepo.update(
      { ticketId, senderRole: In(['admin', 'consultant', 'system']), readAt: IsNull() },
      { readAt: new Date() },
    );
    t.unreadUser = 0;
    await this.ticketRepo.save(t);
  }

  async unreadCountForUser(userId: string): Promise<number> {
    const rows = await this.dataSource.query<{ sum: string }[]>(
      `SELECT COALESCE(SUM(unread_user),0)::text AS sum FROM crm.support_tickets WHERE user_id = $1`,
      [userId],
    );
    return Number(rows[0]?.sum) || 0;
  }

  // ── Admin-facing actions ───────────────────────────────────────────────

  async listAllTickets(query: { status?: string; search?: string }) {
    // Raw SQL — TypeORM's qb.leftJoin + addSelect with AS aliases was
    // silently returning 0 rows on the live DB even though the underlying
    // table had data. Going direct keeps the code obvious and verifiable.
    const params: unknown[] = [];
    const where: string[] = [];

    if (query.status && query.status !== 'all') {
      params.push(query.status);
      where.push(`t.status = $${params.length}`);
    }
    if (query.search) {
      params.push(`%${query.search}%`);
      const i = params.length;
      where.push(
        `(t.subject ILIKE $${i} OR u.first_name ILIKE $${i} OR u.last_name ILIKE $${i} OR u.email ILIKE $${i} OR t.guest_name ILIKE $${i} OR t.guest_email ILIKE $${i})`,
      );
    }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const rows = await this.dataSource.query<Array<Record<string, unknown>>>(
      `SELECT
         t.id, t.subject, t.status, t.source, t.source_ref_id AS "sourceRefId",
         t.parcel_id AS "parcelId", t.assigned_to AS "assignedTo",
         t.guest_name AS "guestName", t.guest_email AS "guestEmail", t.guest_phone AS "guestPhone",
         t.unread_admin AS "unreadAdmin", t.unread_user AS "unreadUser",
         t.last_message_at AS "lastMessageAt", t.created_at AS "createdAt",
         t.user_id AS "userId",
         u.first_name AS "uFirstName", u.last_name AS "uLastName", u.email AS "uEmail"
       FROM crm.support_tickets t
       LEFT JOIN auth.users u ON u.id = t.user_id
       ${whereClause}
       ORDER BY t.last_message_at DESC NULLS LAST, t.created_at DESC
       LIMIT 200`,
      params,
    );

    return rows.map((r) => {
      const first = (r.uFirstName as string) || '';
      const last = (r.uLastName as string) || '';
      const display =
        `${first} ${last}`.trim() ||
        (r.uEmail as string) ||
        (r.guestName as string) ||
        (r.guestEmail as string) ||
        'Bilinmeyen';
      return {
        id: r.id,
        subject: r.subject,
        status: r.status,
        source: r.source,
        sourceRefId: r.sourceRefId,
        parcelId: r.parcelId,
        assignedTo: r.assignedTo,
        guestName: r.guestName,
        guestEmail: r.guestEmail,
        guestPhone: r.guestPhone,
        unreadAdmin: Number(r.unreadAdmin) || 0,
        unreadUser: Number(r.unreadUser) || 0,
        lastMessageAt: r.lastMessageAt,
        createdAt: r.createdAt,
        userId: r.userId,
        userDisplayName: display,
        userEmail: r.uEmail || r.guestEmail || null,
      };
    });
  }

  async getTicketForAdmin(ticketId: string) {
    const t = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!t) throw new NotFoundException('Talep bulunamadı');
    const messages = await this.messageRepo.find({
      where: { ticketId },
      order: { createdAt: 'ASC' },
    });
    // Hydrate user metadata for the header.
    let userInfo: { name: string; email: string | null; phone: string | null } = {
      name: t.guestName || 'Misafir',
      email: t.guestEmail,
      phone: t.guestPhone,
    };
    if (t.userId) {
      const row = await this.dataSource.query<
        { first_name: string | null; last_name: string | null; email: string | null; phone: string | null }[]
      >(`SELECT first_name, last_name, email, phone FROM auth.users WHERE id = $1`, [t.userId]);
      const u = row[0];
      if (u) {
        userInfo = {
          name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || 'Kullanıcı',
          email: u.email,
          phone: u.phone,
        };
      }
    }
    return { ticket: t, messages, user: userInfo };
  }

  async sendMessageAsAdmin(ticketId: string, dto: SendSupportMessageDto, adminId: string) {
    const t = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!t) throw new NotFoundException('Talep bulunamadı');
    if (t.status === 'closed') {
      throw new BadRequestException('Kapatılmış talebe mesaj gönderilemez');
    }
    return this.appendMessage(t, dto, 'admin', adminId);
  }

  async markReadAsAdmin(ticketId: string): Promise<void> {
    const t = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!t) throw new NotFoundException('Talep bulunamadı');
    await this.messageRepo.update(
      { ticketId, senderRole: 'user', readAt: IsNull() },
      { readAt: new Date() },
    );
    t.unreadAdmin = 0;
    await this.ticketRepo.save(t);
  }

  async updateStatus(ticketId: string, dto: UpdateTicketStatusDto, adminId: string) {
    const t = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!t) throw new NotFoundException('Talep bulunamadı');
    const prev = t.status;
    t.status = dto.status;
    await this.ticketRepo.save(t);
    await this.messageRepo.save(
      this.messageRepo.create({
        ticketId,
        senderId: adminId,
        senderRole: 'system',
        body: `Durum değişti: ${prev} → ${dto.status}`,
      }),
    );
    return t;
  }

  async assignTicket(ticketId: string, dto: AssignTicketDto) {
    const t = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!t) throw new NotFoundException('Talep bulunamadı');
    t.assignedTo = dto.assignedTo ?? null;
    return this.ticketRepo.save(t);
  }

  async unreadCountForAdmin(): Promise<number> {
    const rows = await this.dataSource.query<{ sum: string }[]>(
      `SELECT COALESCE(SUM(unread_admin),0)::text AS sum FROM crm.support_tickets WHERE status <> 'closed'`,
    );
    return Number(rows[0]?.sum) || 0;
  }

  /**
   * Promote a contact-request row into a live-chat ticket. The original
   * contact body shows up as the user's first message, the optional admin
   * greeting becomes the admin's opening line — so the user gets an email
   * notification and lands in an already-warm conversation.
   */
  async createFromContactRequest(dto: CreateTicketFromContactDto, adminId: string): Promise<SupportTicket> {
    const cr = await this.contactRepo.findOne({ where: { id: dto.contactRequestId } });
    if (!cr) throw new NotFoundException('İletişim talebi bulunamadı');

    const isConsultantApp = (cr.message || '').includes('[DANIŞMAN BAŞVURUSU]');
    const source = isConsultantApp ? 'consultant_application' : 'contact';
    const subject =
      dto.subject?.trim() ||
      (isConsultantApp
        ? `Danışman Başvurusu — ${cr.name || cr.email}`
        : `İletişim Talebi — ${cr.name}`);

    const now = new Date();
    const ticket = this.ticketRepo.create({
      userId: cr.userId || null,
      subject: subject.slice(0, 500),
      status: 'in_progress',
      source,
      sourceRefId: cr.id,
      parcelId: cr.parcelId || null,
      assignedTo: adminId,
      guestName: cr.userId ? null : cr.name,
      guestEmail: cr.userId ? null : cr.email,
      guestPhone: cr.userId ? null : cr.phone,
      unreadAdmin: 0,
      unreadUser: dto.greeting ? 1 : 0,
      lastMessageAt: now,
    });
    const saved = await this.ticketRepo.save(ticket);

    // Replay the original contact body as the user's first message so the
    // admin sees the full thread, then the admin's greeting (if any).
    if (cr.message) {
      await this.messageRepo.save(
        this.messageRepo.create({
          ticketId: saved.id,
          senderId: cr.userId,
          senderRole: 'user',
          body: cr.message,
          readAt: now,
        }),
      );
    }
    if (dto.greeting?.trim()) {
      await this.messageRepo.save(
        this.messageRepo.create({
          ticketId: saved.id,
          senderId: adminId,
          senderRole: 'admin',
          body: dto.greeting.trim(),
        }),
      );
      this.fanOutNewMessageNotification(saved, 'user', dto.greeting.trim()).catch(() => undefined);
    }

    // Stamp the contact-request as in_progress so it stops appearing as "new"
    // in the queue. The contact-request entity doesn't expose status (raw SQL
    // store), so we issue the update directly.
    await this.dataSource.query(
      `UPDATE crm.contact_requests SET status = 'in_progress', updated_at = NOW() WHERE id = $1`,
      [cr.id],
    );

    return saved;
  }

  // ── Internals ──────────────────────────────────────────────────────────

  private async appendMessage(
    t: SupportTicket,
    dto: SendSupportMessageDto,
    senderRole: 'user' | 'admin',
    senderId: string,
  ): Promise<SupportMessage> {
    const body = dto.body?.trim() || null;
    if (!body && !dto.attachmentUrl) {
      throw new BadRequestException('Mesaj veya dosya gönderin');
    }
    const msg = this.messageRepo.create({
      ticketId: t.id,
      senderId,
      senderRole,
      body,
      attachmentUrl: dto.attachmentUrl || null,
      attachmentType: dto.attachmentType || null,
      attachmentName: dto.attachmentName || null,
    });
    const saved = await this.messageRepo.save(msg);

    // Update ticket counters atomically. Sender's own side stays 0.
    const now = new Date();
    if (senderRole === 'user') {
      t.unreadAdmin += 1;
      if (t.status === 'waiting_user') t.status = 'in_progress';
    } else {
      t.unreadUser += 1;
      if (t.status === 'open') t.status = 'in_progress';
    }
    t.lastMessageAt = now;
    await this.ticketRepo.save(t);

    // Notify the other side.
    const notifyRole = senderRole === 'user' ? 'admin' : 'user';
    this.fanOutNewMessageNotification(t, notifyRole, body || (dto.attachmentName ? `Dosya: ${dto.attachmentName}` : 'Yeni mesaj')).catch(() => undefined);

    return saved;
  }

  private async fanOutNewMessageNotification(
    t: SupportTicket,
    notifyRole: 'admin' | 'user',
    preview: string,
  ): Promise<void> {
    const truncated = preview.length > 200 ? preview.slice(0, 200) + '…' : preview;
    const subject = `Destek talebi: ${t.subject}`;
    const meta = { type: `support.${notifyRole}_message`, ticketId: t.id };

    if (notifyRole === 'user') {
      const recipientId = t.userId;
      if (recipientId) {
        await Promise.allSettled([
          this.notifications.enqueue({ userId: recipientId, channel: 'push', subject, body: truncated, metadata: meta }),
          this.notifications.enqueue({ userId: recipientId, channel: 'email', subject, body: truncated, metadata: meta }),
        ]);
      }
      // No userId (guest ticket created from contact) → email guest directly.
      // The notification queue requires a userId so we skip; admin can manually
      // contact via the email shown on the ticket header.
      return;
    }

    // Notify all admins. Cheap broadcast — find admin user IDs.
    const admins = await this.dataSource.query<{ id: string }[]>(`
      SELECT u.id FROM auth.users u
       JOIN auth.user_roles ur ON ur.user_id = u.id
       JOIN auth.roles r ON r.id = ur.role_id
      WHERE r.name IN ('admin','superadmin')
    `);
    await Promise.allSettled(
      admins.map((a) =>
        this.notifications.enqueue({ userId: a.id, channel: 'push', subject, body: truncated, metadata: meta }),
      ),
    );
  }
}
