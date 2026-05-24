import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Parcel } from '../../listings/entities/parcel.entity';

/**
 * Segmented sales/listing reports for administrators.
 *
 * Supports filtering by:
 *   - date range (startDate, endDate)
 *   - location (city, district, neighborhood)
 *   - price range (minPrice, maxPrice)
 *   - area range (minArea, maxArea)
 *   - parcel type (parcelType) and zoning (zoningStatus)
 *   - status (e.g. 'sold' for satılan, 'active' for yayındaki)
 *
 * Returns JSON by default; `?format=csv` or `?format=xlsx` streams a file.
 */
@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminReportsController {
  constructor(
    @InjectRepository(Parcel)
    private readonly parcelRepo: Repository<Parcel>,
  ) {}

  @Get('sales')
  async salesReport(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('city') city?: string,
    @Query('district') district?: string,
    @Query('neighborhood') neighborhood?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('minArea') minArea?: string,
    @Query('maxArea') maxArea?: string,
    @Query('parcelType') parcelType?: string,
    @Query('zoningStatus') zoningStatus?: string,
    @Query('status') status?: string,
    @Query('format') format?: string,
  ) {
    const qb = this.parcelRepo
      .createQueryBuilder('p')
      .orderBy('p.updated_at', 'DESC');

    if (status) {
      qb.andWhere('p.status = :status', { status });
    } else {
      // Default report: only sold parcels
      qb.andWhere('p.status = :status', { status: 'sold' });
    }

    if (startDate) {
      const d = new Date(startDate);
      if (Number.isNaN(d.getTime())) throw new BadRequestException('Geçersiz startDate');
      qb.andWhere('p.updated_at >= :startDate', { startDate: d });
    }
    if (endDate) {
      const d = new Date(endDate);
      if (Number.isNaN(d.getTime())) throw new BadRequestException('Geçersiz endDate');
      // include the whole day
      d.setHours(23, 59, 59, 999);
      qb.andWhere('p.updated_at <= :endDate', { endDate: d });
    }
    if (city) qb.andWhere('p.city = :city', { city });
    if (district) qb.andWhere('p.district = :district', { district });
    if (neighborhood) qb.andWhere('p.neighborhood = :neighborhood', { neighborhood });
    if (parcelType) qb.andWhere('p.land_type = :parcelType', { parcelType });
    if (zoningStatus) qb.andWhere('p.zoning_status = :zoningStatus', { zoningStatus });
    if (minPrice) qb.andWhere('p.price::numeric >= :minPrice', { minPrice });
    if (maxPrice) qb.andWhere('p.price::numeric <= :maxPrice', { maxPrice });
    if (minArea) qb.andWhere('p.area_m2::numeric >= :minArea', { minArea });
    if (maxArea) qb.andWhere('p.area_m2::numeric <= :maxArea', { maxArea });

    const parcels = await qb.take(5000).getMany();

    // Aggregate stats
    const totalValue = parcels.reduce((sum, p) => sum + (p.price ? Number(p.price) : 0), 0);
    const totalArea = parcels.reduce((sum, p) => sum + (p.areaM2 ? Number(p.areaM2) : 0), 0);
    const avgPricePerM2 = totalArea > 0 ? totalValue / totalArea : 0;

    const summary = {
      count: parcels.length,
      totalValue,
      totalArea,
      avgPricePerM2,
      currency: parcels[0]?.currency || 'TRY',
    };

    if (!format || format === 'json') {
      res.json({ summary, data: parcels });
      return;
    }

    const rows = parcels.map((p) => ({
      'İlan No': p.listingId,
      Başlık: p.title,
      Durum: p.status,
      İl: p.city,
      İlçe: p.district,
      'Mahalle/Köy': p.neighborhood || '',
      Ada: p.ada || '',
      Parsel: p.parsel || '',
      'Alan (m²)': p.areaM2 ? Number(p.areaM2) : '',
      Fiyat: p.price ? Number(p.price) : '',
      'Para Birimi': p.currency,
      'm² Fiyatı': p.pricePerM2 ? Number(p.pricePerM2) : '',
      'İmar Durumu': p.zoningStatus || '',
      'Arazi Tipi': p.landType || '',
      'Oluşturulma': p.createdAt?.toISOString() || '',
      'Güncellenme': p.updatedAt?.toISOString() || '',
    }));

    if (format === 'csv') {
      const headers = Object.keys(rows[0] || {});
      const csv =
        '﻿' + // BOM for Turkish Excel
        [headers.join(';')]
          .concat(
            rows.map((r) =>
              headers
                .map((h) => {
                  const v = (r as any)[h];
                  if (v == null) return '';
                  const s = String(v).replace(/"/g, '""');
                  return /[;"\n]/.test(s) ? `"${s}"` : s;
                })
                .join(';'),
            ),
          )
          .join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="sales-report-${Date.now()}.csv"`);
      res.send(csv);
      return;
    }

    if (format === 'xlsx') {
      const ExcelJS = await import('exceljs');
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Satış Raporu');

      // Summary block at top
      ws.addRow(['ÖZET']);
      ws.addRow(['Toplam Kayıt', summary.count]);
      ws.addRow(['Toplam Tutar', summary.totalValue]);
      ws.addRow(['Toplam Alan (m²)', summary.totalArea]);
      ws.addRow(['Ort. m² Fiyatı', summary.avgPricePerM2]);
      ws.addRow([]);

      // Data table
      const headers = Object.keys(rows[0] || {});
      ws.addRow(headers);
      for (const r of rows) {
        ws.addRow(headers.map((h) => (r as any)[h] ?? ''));
      }

      const buffer = await wb.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="sales-report-${Date.now()}.xlsx"`);
      res.send(Buffer.from(buffer));
      return;
    }

    throw new BadRequestException('Desteklenmeyen format. Kullanılabilir: json, csv, xlsx');
  }
}
