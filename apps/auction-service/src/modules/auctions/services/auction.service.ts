import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Auction } from '../entities/auction.entity';
import { AuctionParticipant } from '../entities/auction-participant.entity';
import { AuctionStatus, Deposit } from '@nettapu/shared';
import { CreateAuctionDto } from '../dto/create-auction.dto';
import { UpdateAuctionStatusDto } from '../dto/update-auction-status.dto';
import { ListAuctionsQueryDto } from '../dto/list-auctions-query.dto';

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  // DRAFT can go either to SCHEDULED (queued) or directly LIVE (admin "Hemen Yayınla")
  [AuctionStatus.DRAFT]: [AuctionStatus.SCHEDULED, AuctionStatus.LIVE, AuctionStatus.CANCELLED],
  [AuctionStatus.SCHEDULED]: [AuctionStatus.LIVE, AuctionStatus.DRAFT, AuctionStatus.CANCELLED],
  [AuctionStatus.LIVE]: [AuctionStatus.ENDING, AuctionStatus.ENDED, AuctionStatus.CANCELLED],
  [AuctionStatus.ENDING]: [AuctionStatus.ENDED, AuctionStatus.CANCELLED],
  // ENDED auctions can be relisted (admin re-runs an expired auction with new dates)
  [AuctionStatus.ENDED]: [AuctionStatus.SETTLING, AuctionStatus.SCHEDULED, AuctionStatus.DRAFT],
  [AuctionStatus.SETTLING]: [AuctionStatus.SETTLED, AuctionStatus.SETTLEMENT_FAILED],
  [AuctionStatus.SETTLEMENT_FAILED]: [AuctionStatus.SETTLED],
  // CANCELLED can be revived as DRAFT for re-publishing
  [AuctionStatus.CANCELLED]: [AuctionStatus.DRAFT, AuctionStatus.SCHEDULED],
};

@Injectable()
export class AuctionService {
  private readonly logger = new Logger(AuctionService.name);

  constructor(
    @InjectRepository(Auction)
    private readonly auctionRepo: Repository<Auction>,
    @InjectRepository(AuctionParticipant)
    private readonly participantRepo: Repository<AuctionParticipant>,
    @InjectRepository(Deposit)
    private readonly depositRepo: Repository<Deposit>,
    private readonly ds: DataSource,
  ) {}

  async create(dto: CreateAuctionDto, userId: string): Promise<Auction> {
    // Default to SCHEDULED — admins overwhelmingly want auctions to be
    // visible immediately (bidding opens automatically at startTime).
    // Draft remains available as an explicit escape hatch.
    const initialStatus =
      dto.status === 'draft' ? AuctionStatus.DRAFT : AuctionStatus.SCHEDULED;

    const auction = this.auctionRepo.create({
      parcelId: dto.parcelId,
      title: dto.title,
      description: dto.description ?? null,
      status: initialStatus,
      startingPrice: dto.startingPrice,
      minimumIncrement: dto.minimumIncrement,
      requiredDeposit: dto.requiredDeposit,
      currency: dto.currency ?? 'TRY',
      scheduledStart: new Date(dto.startTime),
      scheduledEnd: new Date(dto.endTime),
      depositDeadline: new Date(dto.depositDeadline),
      createdBy: userId,
      sniperEnabled: dto.sniperEnabled ?? true,
      sniperWindowSeconds: dto.sniperWindowSeconds ?? null,
      sniperExtensionSeconds: dto.sniperExtensionSeconds ?? null,
      maxSniperExtensions: dto.maxSniperExtensions ?? null,
    });

    const saved = await this.auctionRepo.save(auction);
    this.logger.log(`Auction created: ${saved.id} by user ${userId} (status=${initialStatus})`);
    return saved;
  }

  async findAll(
    query: ListAuctionsQueryDto,
  ): Promise<{ data: Auction[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.auctionRepo.createQueryBuilder('auction');

    if (query.status) {
      qb.where('auction.status = :status', { status: query.status });
    }

    qb.orderBy('auction.createdAt', 'DESC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    // Enrich auctions with parcel data (title, city, district, images)
    const enriched = await this.enrichWithParcelData(data);

    return {
      data: enriched,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<Auction> {
    const auction = await this.auctionRepo.findOne({ where: { id } });
    if (!auction) {
      throw new NotFoundException(`Auction ${id} not found`);
    }
    const [enriched] = await this.enrichWithParcelData([auction]);
    return enriched;
  }

  private async enrichWithParcelData(auctions: Auction[]): Promise<any[]> {
    if (auctions.length === 0) return [];

    const parcelIds = [...new Set(auctions.map((a) => a.parcelId))];

    // Fetch parcel basic info
    const parcels: Array<{ id: string; title: string; city: string; district: string }> = await this.ds.query(
      `SELECT id, title, city, district FROM listings.parcels WHERE id = ANY($1)`,
      [parcelIds],
    );

    // Fetch parcel images (cover first, then by sort_order)
    const images: Array<{
      parcel_id: string;
      original_url: string;
      watermarked_url: string | null;
      thumbnail_url: string | null;
      is_cover: boolean;
    }> = await this.ds.query(
      `SELECT parcel_id, original_url, watermarked_url, thumbnail_url, is_cover
       FROM listings.parcel_images
       WHERE parcel_id = ANY($1) AND status = 'ready'
       ORDER BY is_cover DESC, sort_order ASC`,
      [parcelIds],
    );

    const parcelMap = new Map(parcels.map((p) => [p.id, p]));
    const imageMap = new Map<string, typeof images>();
    for (const img of images) {
      const arr = imageMap.get(img.parcel_id) || [];
      arr.push(img);
      imageMap.set(img.parcel_id, arr);
    }

    return auctions.map((auction) => {
      const parcel = parcelMap.get(auction.parcelId);
      const parcelImages = imageMap.get(auction.parcelId) || [];
      return {
        ...auction,
        parcel: parcel
          ? {
              title: parcel.title,
              city: parcel.city,
              district: parcel.district,
              images: parcelImages.map((img) => ({
                originalUrl: img.original_url,
                watermarkedUrl: img.watermarked_url,
                thumbnailUrl: img.thumbnail_url,
                isCover: img.is_cover,
              })),
            }
          : null,
      };
    });
  }

  async getMyParticipation(
    auctionId: string,
    userId: string,
  ): Promise<{ eligible: boolean; depositStatus: string | null }> {
    const participant = await this.participantRepo.findOne({
      where: { auctionId, userId },
    });

    if (!participant) {
      return { eligible: false, depositStatus: null };
    }

    const deposit = await this.depositRepo.findOne({
      where: { id: participant.depositId },
    });

    return {
      eligible: participant.eligible,
      depositStatus: deposit?.status ?? null,
    };
  }

  async remove(id: string): Promise<void> {
    const auction = await this.auctionRepo.findOne({ where: { id } });
    if (!auction) {
      throw new NotFoundException(`Auction ${id} not found`);
    }

    // Clean up all related records using raw queries
    // Disable append-only triggers, delete everything, re-enable
    try {
      await this.ds.query('ALTER TABLE auctions.bids DISABLE TRIGGER trg_bids_no_delete');
      await this.ds.query('ALTER TABLE auctions.bid_rejections DISABLE TRIGGER trg_bid_rejections_no_delete');

      await this.ds.query('DELETE FROM auctions.settlement_manifests WHERE auction_id = $1', [id]);
      await this.ds.query('DELETE FROM auctions.bid_rejections WHERE auction_id = $1', [id]);
      await this.ds.query('DELETE FROM auctions.bids_corrections WHERE original_bid_id IN (SELECT id FROM auctions.bids WHERE auction_id = $1)', [id]);
      await this.ds.query('DELETE FROM auctions.bids WHERE auction_id = $1', [id]);
      await this.ds.query('DELETE FROM auctions.auction_consents WHERE auction_id = $1', [id]);
      await this.ds.query('DELETE FROM auctions.auction_participants WHERE auction_id = $1', [id]);
      await this.ds.query('DELETE FROM auctions.event_outbox WHERE aggregate_id = $1', [id]);
      await this.ds.query('DELETE FROM auctions.auctions WHERE id = $1', [id]);

      this.logger.log(`Auction ${id} and all related records deleted`);
    } catch (err) {
      this.logger.error(`Failed to delete auction ${id}`, err);
      throw err;
    } finally {
      await this.ds.query('ALTER TABLE auctions.bids ENABLE TRIGGER trg_bids_no_delete').catch(() => {});
      await this.ds.query('ALTER TABLE auctions.bid_rejections ENABLE TRIGGER trg_bid_rejections_no_delete').catch(() => {});
    }
  }

  async updateStatus(id: string, dto: UpdateAuctionStatusDto): Promise<Auction> {
    const auction = await this.auctionRepo.findOne({ where: { id } });
    if (!auction) {
      throw new NotFoundException(`Auction ${id} not found`);
    }

    if (auction.version !== dto.version) {
      throw new ConflictException(
        `Version conflict: expected ${dto.version}, current ${auction.version}`,
      );
    }

    const allowed = ALLOWED_TRANSITIONS[auction.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Invalid status transition: ${auction.status} -> ${dto.status}. Allowed: [${allowed.join(', ')}]`,
      );
    }

    const oldStatus = auction.status;
    auction.status = dto.status;

    if (dto.status === AuctionStatus.LIVE) {
      const liveCount = await this.auctionRepo.count({
        where: { status: AuctionStatus.LIVE as string },
      });
      if (liveCount >= 10) {
        throw new ConflictException(
          `Cannot go LIVE: ${liveCount} auctions already live (max 10)`,
        );
      }
      auction.actualStart = new Date();
    }

    if (dto.status === AuctionStatus.ENDED || dto.status === AuctionStatus.CANCELLED) {
      auction.endedAt = new Date();
    }

    try {
      const saved = await this.auctionRepo.save(auction);
      this.logger.log(`Auction ${id} status: ${oldStatus} -> ${dto.status}`);
      return saved;
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        err.name === 'OptimisticLockVersionMismatchError'
      ) {
        throw new ConflictException(
          'Concurrent modification detected. Please retry with current version.',
        );
      }
      throw err;
    }
  }
}
