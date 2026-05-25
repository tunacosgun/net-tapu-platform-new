import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { Repository, DataSource } from 'typeorm';
import { Favorite } from '../entities/favorite.entity';
import { Parcel } from '../entities/parcel.entity';
import { NotificationService } from '../../notifications/notification.service';

/**
 * Weekly favorites digest:
 * Every Monday at 09:00 (server time), sends each user with favorites a summary
 * email + push reminding them of their saved listings.
 *
 * Designed to be lightweight: batches by user, uses existing notification queue.
 */
@Injectable()
export class FavoriteDigestWorker {
  private readonly logger = new Logger(FavoriteDigestWorker.name);

  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,
    @InjectRepository(Parcel)
    private readonly parcelRepo: Repository<Parcel>,
    private readonly notifications: NotificationService,
    private readonly dataSource: DataSource,
  ) {}

  // Every Monday at 09:00
  @Cron('0 9 * * 1', { timeZone: 'Europe/Istanbul' })
  async sendWeeklyDigest(): Promise<void> {
    this.logger.log('Favorite digest worker: starting weekly run');
    try {
      const userIds = await this.favoriteRepo
        .createQueryBuilder('f')
        .select('DISTINCT f.user_id', 'userId')
        .getRawMany<{ userId: string }>();

      for (const { userId } of userIds) {
        try {
          await this.sendForUser(userId);
        } catch (e) {
          this.logger.warn(`Digest failed for user ${userId}: ${(e as Error).message}`);
        }
      }
      this.logger.log(`Favorite digest: sent to ${userIds.length} users`);
    } catch (e) {
      this.logger.error(`Favorite digest run failed: ${(e as Error).message}`);
    }
  }

  /** Manual trigger (admin / test) */
  async sendForUser(userId: string): Promise<void> {
    const favorites = await this.favoriteRepo.find({ where: { userId } });
    if (favorites.length === 0) return;

    const parcelIds = favorites.map((f) => f.parcelId);
    const parcels = await this.parcelRepo
      .createQueryBuilder('p')
      .where('p.id IN (:...ids)', { ids: parcelIds })
      .andWhere('p.status = :status', { status: 'active' })
      .getMany();

    if (parcels.length === 0) return;

    const lines = parcels.slice(0, 10).map((p) => {
      const price = p.price ? `${Number(p.price).toLocaleString('tr-TR')} ${p.currency || 'TRY'}` : 'Fiyat sorulur';
      return `• ${p.title} — ${p.city}/${p.district} — ${price}`;
    });
    const body = [
      `Favori arsalarınızda ${parcels.length} aktif ilan var:`,
      '',
      ...lines,
      parcels.length > 10 ? `\n... ve ${parcels.length - 10} ilan daha.` : '',
      '',
      'Tümünü görmek için profil > Favoriler ekranına gidin.',
    ].join('\n');

    await Promise.all([
      this.notifications.enqueue({
        userId,
        channel: 'email',
        subject: `Favori ilanlarınızdan haberler (${parcels.length} aktif)`,
        body,
        metadata: { type: 'favorite.weekly_digest', count: parcels.length },
      }),
      this.notifications.enqueue({
        userId,
        channel: 'push',
        subject: 'Favorilerinizi kontrol edin',
        body: `${parcels.length} favori ilanınız hâlâ aktif. Profil > Favoriler.`,
        metadata: { type: 'favorite.weekly_digest', count: parcels.length },
      }),
    ]);
  }
}
