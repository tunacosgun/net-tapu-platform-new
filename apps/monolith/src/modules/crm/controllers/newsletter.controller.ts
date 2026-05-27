import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

class SubscribeDto {
  @IsEmail() @MaxLength(255)
  email!: string;

  @IsOptional() @IsString() @MaxLength(200)
  name?: string;

  @IsOptional() @IsString() @MaxLength(50)
  source?: string;
}

@Controller('newsletter')
export class NewsletterController {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  /** Public: subscribe email to newsletter (footer form, popups, etc.) */
  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  async subscribe(@Body() dto: SubscribeDto) {
    const email = dto.email.trim().toLowerCase();
    if (!email) throw new BadRequestException('E-posta zorunlu.');
    await this.ds.query(
      `INSERT INTO crm.newsletter_subscribers (email, name, source, is_active, subscribed_at)
       VALUES ($1, $2, $3, TRUE, NOW())
       ON CONFLICT ((LOWER(email))) DO UPDATE SET
         is_active = TRUE,
         unsubscribed_at = NULL,
         name = COALESCE(EXCLUDED.name, crm.newsletter_subscribers.name),
         source = EXCLUDED.source`,
      [email, dto.name ?? null, dto.source ?? 'footer'],
    );
    return { ok: true, message: 'E-bültene başarıyla abone oldunuz.' };
  }

  /** Admin: list all subscribers with optional search */
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async listAdmin(@Query('q') q?: string, @Query('limit') limit = '100') {
    const lim = Math.min(parseInt(String(limit), 10) || 100, 500);
    const rows = await this.ds.query(
      q
        ? `SELECT id, email, name, source, is_active, subscribed_at FROM crm.newsletter_subscribers
           WHERE LOWER(email) LIKE LOWER($1) OR LOWER(COALESCE(name,'')) LIKE LOWER($1)
           ORDER BY subscribed_at DESC LIMIT $2`
        : `SELECT id, email, name, source, is_active, subscribed_at FROM crm.newsletter_subscribers
           ORDER BY subscribed_at DESC LIMIT $1`,
      q ? [`%${q}%`, lim] : [lim],
    );
    return { data: rows, total: rows.length };
  }
}
