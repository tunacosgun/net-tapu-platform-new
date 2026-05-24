import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deposit } from '@nettapu/shared';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('admin/finance/deposits')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminDepositController {
  constructor(
    @InjectRepository(Deposit)
    private readonly depositRepo: Repository<Deposit>,
  ) {}

  @Get()
  async list(
    @Query('limit') limit = '20',
    @Query('offset') offset = '0',
    @Query('status') status?: string,
    @Query('auction_id') auctionId?: string,
    @Query('search') search?: string,
  ) {
    const take = Math.min(Number(limit) || 20, 100);
    const skip = Number(offset) || 0;

    const qb = this.depositRepo
      .createQueryBuilder('d')
      .leftJoin('auth.users', 'u', 'u.id = d.user_id')
      .leftJoin('auctions.auctions', 'a', 'a.id = d.auction_id')
      .leftJoin('listings.parcels', 'p', 'p.id = a.parcel_id')
      .addSelect([
        'u.first_name AS user_first_name',
        'u.last_name AS user_last_name',
        'u.email AS user_email',
        'a.title AS auction_title',
        'p.title AS parcel_title',
        'p.listing_id AS parcel_listing_id',
      ])
      .orderBy('d.created_at', 'DESC')
      .take(take)
      .skip(skip);

    if (status) {
      qb.andWhere('d.status = :status', { status });
    }
    if (auctionId) {
      qb.andWhere('d.auction_id = :auctionId', { auctionId });
    }
    if (search) {
      qb.andWhere(
        '(u.first_name ILIKE :s OR u.last_name ILIKE :s OR u.email ILIKE :s OR a.title ILIKE :s OR p.title ILIKE :s)',
        { s: `%${search}%` },
      );
    }

    const total = await qb.getCount();
    const raw = await qb.getRawAndEntities();

    const data = raw.entities.map((deposit, idx) => {
      const r = raw.raw[idx] || {};
      const firstName = r.user_first_name || '';
      const lastName = r.user_last_name || '';
      const userName = `${firstName} ${lastName}`.trim() || r.user_email || '';
      return {
        ...deposit,
        user: {
          firstName,
          lastName,
          email: r.user_email || null,
          fullName: userName,
        },
        auction: {
          title: r.auction_title || r.parcel_title || null,
        },
        parcelTitle: r.parcel_title || null,
        parcelListingId: r.parcel_listing_id || null,
      };
    });

    return {
      data,
      meta: { total, limit: take, offset: skip },
    };
  }
}
