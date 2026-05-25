import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, LessThan, DataSource } from 'typeorm';
import { Refund } from '@nettapu/shared';
import { Payment } from '../entities/payment.entity';
import { ReconciliationQueryDto } from '../dto/reconciliation-query.dto';

const DEFAULT_OLDER_THAN_MINUTES = 30;
const DEFAULT_LIMIT = 50;

export interface StaleRecord {
  id: string;
  amount: string;
  currency: string;
  status: string;
  staleSinceMinutes: number;
}

export interface ReconciliationReport {
  generatedAt: string;
  thresholdMinutes: number;
  stalePendingPayments: (StaleRecord & {
    userId: string;
    userName: string | null;
    userEmail: string | null;
    parcelId: string | null;
    parcelTitle: string | null;
  })[];
  stalePendingRefunds: (StaleRecord & {
    paymentId: string | null;
    reason: string;
    userName: string | null;
    userEmail: string | null;
  })[];
}

@Injectable()
export class ReconciliationService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Refund)
    private readonly refundRepo: Repository<Refund>,
    @InjectDataSource()
    private readonly ds: DataSource,
  ) {}

  async getReconciliationReport(query: ReconciliationQueryDto): Promise<ReconciliationReport> {
    const thresholdMinutes = query.olderThanMinutes ?? DEFAULT_OLDER_THAN_MINUTES;
    const limit = query.limit ?? DEFAULT_LIMIT;
    const cutoff = new Date(Date.now() - thresholdMinutes * 60_000);

    const [payments, refunds] = await Promise.all([
      this.findStalePendingPaymentsEnriched(cutoff, limit),
      this.findStalePendingRefundsEnriched(cutoff, limit),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      thresholdMinutes,
      stalePendingPayments: payments.map((p) => ({
        id: p.id,
        userId: p.user_id,
        userName: p.user_name || null,
        userEmail: p.user_email || null,
        parcelId: p.parcel_id || null,
        parcelTitle: p.parcel_title || null,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        staleSinceMinutes: Math.round((Date.now() - new Date(p.created_at).getTime()) / 60_000),
      })),
      stalePendingRefunds: refunds.map((r) => ({
        id: r.id,
        paymentId: r.payment_id || null,
        amount: r.amount,
        currency: r.currency,
        status: r.status,
        reason: r.reason,
        userName: r.user_name || null,
        userEmail: r.user_email || null,
        staleSinceMinutes: Math.round((Date.now() - new Date(r.initiated_at).getTime()) / 60_000),
      })),
    };
  }

  /**
   * Returns stale pending payments enriched with user name+email and parcel title.
   * Uses raw SQL to keep this read-only and avoid TypeORM relation overhead.
   */
  private async findStalePendingPaymentsEnriched(cutoff: Date, limit: number): Promise<Array<{
    id: string; user_id: string; parcel_id: string | null; amount: string; currency: string;
    status: string; created_at: string;
    user_name: string | null; user_email: string | null; parcel_title: string | null;
  }>> {
    return this.ds.query(
      `SELECT p.id, p.user_id, p.parcel_id, p.amount, p.currency, p.status, p.created_at,
              NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), '') AS user_name,
              u.email AS user_email,
              pa.title AS parcel_title
         FROM payments.payments p
         LEFT JOIN auth.users u ON u.id = p.user_id
         LEFT JOIN listings.parcels pa ON pa.id = p.parcel_id
        WHERE p.status = 'pending' AND p.created_at < $1
        ORDER BY p.created_at ASC
        LIMIT $2`,
      [cutoff, limit],
    );
  }

  private async findStalePendingRefundsEnriched(cutoff: Date, limit: number): Promise<Array<{
    id: string; payment_id: string | null; amount: string; currency: string;
    status: string; reason: string; initiated_at: string;
    user_name: string | null; user_email: string | null;
  }>> {
    return this.ds.query(
      `SELECT r.id, r.payment_id, r.amount, r.currency, r.status, r.reason, r.initiated_at,
              NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), '') AS user_name,
              u.email AS user_email
         FROM payments.refunds r
         LEFT JOIN payments.payments p ON p.id = r.payment_id
         LEFT JOIN auth.users u ON u.id = p.user_id
        WHERE r.status = 'pending' AND r.initiated_at < $1
        ORDER BY r.initiated_at ASC
        LIMIT $2`,
      [cutoff, limit],
    );
  }
}
