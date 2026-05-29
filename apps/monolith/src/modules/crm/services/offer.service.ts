import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Offer } from '../entities/offer.entity';
import { OfferResponse } from '../entities/offer-response.entity';
import { CreateOfferDto } from '../dto/create-offer.dto';
import { RespondToOfferDto } from '../dto/respond-to-offer.dto';
import { ListOffersQueryDto } from '../dto/list-offers-query.dto';
import { Parcel } from '../../listings/entities/parcel.entity';
import { NotificationService } from '../../notifications/notification.service';

/** Buyer offers may not be lower than this fraction of the asking price. */
const MIN_OFFER_RATIO = 0.8;

const RESPONSE_STATUS_MAP: Record<string, string> = {
  accept: 'accepted',
  reject: 'rejected',
  counter: 'countered',
};

@Injectable()
export class OfferService {
  private readonly logger = new Logger(OfferService.name);

  constructor(
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
    @InjectRepository(OfferResponse)
    private readonly responseRepo: Repository<OfferResponse>,
    @InjectRepository(Parcel)
    private readonly parcelRepo: Repository<Parcel>,
    private readonly dataSource: DataSource,
    private readonly notifications: NotificationService,
  ) {}

  async create(dto: CreateOfferDto, userId: string): Promise<Offer> {
    // Enforce minimum-offer rule: buyer may not bid below MIN_OFFER_RATIO of asking price.
    const parcel = await this.parcelRepo.findOne({ where: { id: dto.parcelId } });
    if (!parcel) {
      throw new NotFoundException('Arsa bulunamadı');
    }
    if (parcel.price) {
      const askingPrice = Number(parcel.price);
      const minAllowed = Math.floor(askingPrice * MIN_OFFER_RATIO);
      if (Number(dto.amount) < minAllowed) {
        throw new BadRequestException(
          `Teklif tutarı, ilan fiyatının %${Math.round((1 - MIN_OFFER_RATIO) * 100)}'inden daha düşük olamaz. En düşük kabul edilebilir teklif: ${minAllowed.toLocaleString('tr-TR')} ${parcel.currency || 'TRY'}`,
        );
      }
    }

    const entity = this.offerRepo.create({
      userId,
      parcelId: dto.parcelId,
      amount: dto.amount,
      currency: dto.currency ?? 'TRY',
      message: dto.message ?? null,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      status: 'pending',
    });

    const saved = await this.offerRepo.save(entity);
    this.logger.log(`Offer created: ${saved.id} by ${userId} for parcel ${saved.parcelId}`);

    // Notify the parcel owner (assignedConsultant if set, otherwise createdBy)
    const recipientId = parcel.assignedConsultant || parcel.createdBy;
    if (recipientId) {
      const amountFmt = Number(dto.amount).toLocaleString('tr-TR');
      const body = `${parcel.title || 'İlan'} için yeni bir teklif aldınız: ${amountFmt} ${dto.currency ?? 'TRY'}.`;
      try {
        await Promise.all([
          this.notifications.enqueue({
            userId: recipientId,
            channel: 'push',
            subject: 'Yeni Teklif',
            body,
            metadata: { type: 'offer.created', offerId: saved.id, parcelId: parcel.id },
          }),
          this.notifications.enqueue({
            userId: recipientId,
            channel: 'email',
            subject: `Yeni teklif: ${parcel.title || 'İlan'}`,
            body,
            metadata: { type: 'offer.created', offerId: saved.id, parcelId: parcel.id },
          }),
        ]);
      } catch (e) {
        this.logger.warn(`Failed to enqueue offer notifications: ${(e as Error).message}`);
      }
    }

    return saved;
  }

  async findAll(
    query: ListOffersQueryDto & { search?: string },
  ): Promise<{ data: any[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.offerRepo
      .createQueryBuilder('o')
      .leftJoin('auth.users', 'u', 'u.id = o.user_id')
      .leftJoin('listings.parcels', 'p', 'p.id = o.parcel_id')
      .addSelect([
        'u.first_name AS user_first_name',
        'u.last_name AS user_last_name',
        'u.email AS user_email',
        'p.title AS parcel_title',
        'p.listing_id AS parcel_listing_id',
        'p.price AS parcel_price',
      ]);

    if (query.status) {
      qb.andWhere('o.status = :status', { status: query.status });
    }
    if (query.parcel_id) {
      qb.andWhere('o.parcel_id = :parcelId', { parcelId: query.parcel_id });
    }
    if (query.user_id) {
      qb.andWhere('o.user_id = :userId', { userId: query.user_id });
    }
    if (query.search) {
      qb.andWhere(
        '(u.first_name ILIKE :s OR u.last_name ILIKE :s OR u.email ILIKE :s OR p.title ILIKE :s)',
        { s: `%${query.search}%` },
      );
    }

    qb.orderBy('o.created_at', 'DESC').skip(skip).take(limit);

    const total = await qb.getCount();
    const raw = await qb.getRawAndEntities();

    const data = raw.entities.map((offer, idx) => {
      const r = raw.raw[idx] || {};
      const firstName = r.user_first_name || '';
      const lastName = r.user_last_name || '';
      const userName = `${firstName} ${lastName}`.trim() || r.user_email || '';
      return {
        ...offer,
        userName,
        userEmail: r.user_email || null,
        parcelTitle: r.parcel_title || null,
        parcelListingId: r.parcel_listing_id || null,
        parcelPrice: r.parcel_price || null,
      };
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByUser(userId: string): Promise<any[]> {
    const offers = await this.offerRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    if (!offers.length) return [];

    // Pull responses + parcel metadata so the buyer's "My Offers" page can
    // show counter amounts and parcel titles in one round-trip.
    const ids = offers.map((o) => o.id);
    const responses = await this.responseRepo.find({
      where: { offerId: In(ids) },
      order: { createdAt: 'ASC' },
    });
    const parcelIds = Array.from(new Set(offers.map((o) => o.parcelId)));
    const parcels = await this.parcelRepo.find({ where: { id: In(parcelIds) } });
    const parcelMap = new Map(parcels.map((p) => [p.id, p]));
    const responsesByOffer = new Map<string, OfferResponse[]>();
    for (const r of responses) {
      const arr = responsesByOffer.get(r.offerId) ?? [];
      arr.push(r);
      responsesByOffer.set(r.offerId, arr);
    }

    return offers.map((o) => {
      const p = parcelMap.get(o.parcelId);
      const respArr = responsesByOffer.get(o.id) ?? [];
      const lastCounter = [...respArr].reverse().find((r) => r.responseType === 'counter');
      return {
        ...o,
        parcelTitle: p?.title || null,
        parcelListingId: p?.listingId || null,
        parcelPrice: p?.price || null,
        parcelCurrency: p?.currency || 'TRY',
        responses: respArr,
        lastCounterAmount: lastCounter?.counterAmount ?? null,
      };
    });
  }

  async findById(id: string): Promise<Offer> {
    const entity = await this.offerRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Offer ${id} not found`);
    }
    return entity;
  }

  async respond(id: string, dto: RespondToOfferDto, respondedBy: string): Promise<OfferResponse> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const offer = await qr.manager
        .createQueryBuilder(Offer, 'o')
        .setLock('pessimistic_write')
        .where('o.id = :id', { id })
        .getOne();

      if (!offer) {
        throw new NotFoundException(`Offer ${id} not found`);
      }

      if (offer.status !== 'pending') {
        throw new BadRequestException(`Offer ${id} is not pending (current: ${offer.status})`);
      }

      const newStatus = RESPONSE_STATUS_MAP[dto.responseType];
      if (!newStatus) {
        throw new BadRequestException(`Invalid response type: ${dto.responseType}`);
      }

      offer.status = newStatus;
      await qr.manager.save(Offer, offer);

      const response = qr.manager.create(OfferResponse, {
        offerId: id,
        respondedBy,
        responseType: dto.responseType,
        counterAmount: dto.counterAmount ?? null,
        message: dto.message ?? null,
      });
      await qr.manager.save(OfferResponse, response);

      await qr.commitTransaction();
      this.logger.log(`Offer ${id} responded: ${dto.responseType} by ${respondedBy}`);

      // Notify the original bidder. Buyer needs to know whether their offer
      // was accepted/rejected/countered — without this they're left guessing.
      this.notifyBidderOfResponse(offer, dto).catch((err) => {
        this.logger.warn(`Failed to notify bidder of offer ${id} response: ${(err as Error).message}`);
      });

      return response;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  private async notifyBidderOfResponse(offer: Offer, dto: RespondToOfferDto): Promise<void> {
    const parcel = await this.parcelRepo.findOne({ where: { id: offer.parcelId } });
    const parcelTitle = parcel?.title || 'İlan';
    const currency = parcel?.currency || 'TRY';

    let subject = '';
    let body = '';
    if (dto.responseType === 'accept') {
      subject = 'Teklifiniz kabul edildi';
      body = `"${parcelTitle}" ilanı için verdiğiniz teklif kabul edildi. Satıcı sizinle iletişime geçecek.`;
    } else if (dto.responseType === 'reject') {
      subject = 'Teklifiniz reddedildi';
      body = `"${parcelTitle}" ilanı için verdiğiniz teklif reddedildi. Daha yüksek bir teklifle tekrar deneyebilirsiniz.`;
    } else if (dto.responseType === 'counter') {
      const counterFmt = dto.counterAmount ? Number(dto.counterAmount).toLocaleString('tr-TR') : '';
      subject = 'Size karşı teklif yapıldı';
      body = `"${parcelTitle}" ilanında satıcıdan karşı teklif: ${counterFmt} ${currency}. Profilinizden cevaplayabilirsiniz.${dto.message ? `\n\nNot: ${dto.message}` : ''}`;
    }
    if (!subject) return;

    const metadata = {
      type: `offer.${dto.responseType}`,
      offerId: offer.id,
      parcelId: offer.parcelId,
      counterAmount: dto.counterAmount ?? null,
    };
    await Promise.allSettled([
      this.notifications.enqueue({ userId: offer.userId, channel: 'push', subject, body, metadata }),
      this.notifications.enqueue({ userId: offer.userId, channel: 'email', subject, body, metadata }),
    ]);
  }

  /**
   * Buyer-side response to a seller's counter-offer.
   *
   * After a seller counters (status = 'countered'), the buyer can:
   *   - 'accept'  → deal closed at the seller's counter amount (status = 'accepted')
   *   - 'reject'  → buyer drops out (status = 'rejected')
   *   - 'counter' → buyer makes their own counter; status flips back to 'pending'
   *                 so the seller sees it as a fresh actionable offer
   */
  async buyerRespond(id: string, dto: RespondToOfferDto, userId: string): Promise<OfferResponse> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const offer = await qr.manager
        .createQueryBuilder(Offer, 'o')
        .setLock('pessimistic_write')
        .where('o.id = :id', { id })
        .getOne();
      if (!offer) throw new NotFoundException(`Offer ${id} not found`);
      if (offer.userId !== userId) {
        throw new ForbiddenException('Yalnızca teklif sahibi karşı teklife cevap verebilir');
      }
      if (offer.status !== 'countered') {
        throw new BadRequestException(`Offer is not in countered state (current: ${offer.status})`);
      }

      if (dto.responseType === 'accept') {
        offer.status = 'accepted';
      } else if (dto.responseType === 'reject') {
        offer.status = 'rejected';
      } else if (dto.responseType === 'counter') {
        if (!dto.counterAmount) {
          throw new BadRequestException('Karşı teklif için tutar zorunludur');
        }
        offer.amount = dto.counterAmount;
        offer.status = 'pending';
      } else {
        throw new BadRequestException(`Invalid response type: ${dto.responseType}`);
      }
      await qr.manager.save(Offer, offer);

      const response = qr.manager.create(OfferResponse, {
        offerId: id,
        respondedBy: userId,
        responseType: dto.responseType,
        counterAmount: dto.counterAmount ?? null,
        message: dto.message ?? null,
      });
      await qr.manager.save(OfferResponse, response);
      await qr.commitTransaction();
      this.logger.log(`Offer ${id} buyer-responded: ${dto.responseType} by ${userId}`);

      // Notify the seller (parcel owner) about the buyer's response.
      this.notifySellerOfBuyerResponse(offer, dto).catch((err) => {
        this.logger.warn(`Failed to notify seller of buyer response: ${(err as Error).message}`);
      });

      return response;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  private async notifySellerOfBuyerResponse(offer: Offer, dto: RespondToOfferDto): Promise<void> {
    const parcel = await this.parcelRepo.findOne({ where: { id: offer.parcelId } });
    if (!parcel) return;
    const recipientId = parcel.assignedConsultant || parcel.createdBy;
    if (!recipientId) return;

    const title = parcel.title || 'İlan';
    const currency = parcel.currency || 'TRY';
    let subject = '';
    let body = '';
    if (dto.responseType === 'accept') {
      subject = 'Alıcı karşı teklifinizi kabul etti';
      body = `"${title}" ilanında alıcı, karşı teklifinizi kabul etti.`;
    } else if (dto.responseType === 'reject') {
      subject = 'Alıcı karşı teklifinizi reddetti';
      body = `"${title}" ilanında alıcı, karşı teklifinizi reddetti.`;
    } else if (dto.responseType === 'counter') {
      const amt = dto.counterAmount ? Number(dto.counterAmount).toLocaleString('tr-TR') : '';
      subject = 'Alıcı yeni teklif gönderdi';
      body = `"${title}" ilanında alıcı yeni bir teklif gönderdi: ${amt} ${currency}.`;
    }
    if (!subject) return;

    await Promise.allSettled([
      this.notifications.enqueue({
        userId: recipientId, channel: 'push', subject, body,
        metadata: { type: `offer.buyer_${dto.responseType}`, offerId: offer.id, parcelId: parcel.id },
      }),
      this.notifications.enqueue({
        userId: recipientId, channel: 'email', subject, body,
        metadata: { type: `offer.buyer_${dto.responseType}`, offerId: offer.id, parcelId: parcel.id },
      }),
    ]);
  }

  async withdraw(id: string, userId: string): Promise<Offer> {
    const offer = await this.findById(id);

    if (offer.userId !== userId) {
      throw new BadRequestException('Only the offer creator can withdraw');
    }
    if (offer.status !== 'pending') {
      throw new BadRequestException(`Cannot withdraw offer in status: ${offer.status}`);
    }

    offer.status = 'withdrawn';
    const saved = await this.offerRepo.save(offer);
    this.logger.log(`Offer ${id} withdrawn by ${userId}`);
    return saved;
  }
}
