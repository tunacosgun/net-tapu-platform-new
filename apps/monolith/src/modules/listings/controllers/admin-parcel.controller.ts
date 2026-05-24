import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/auth.service';
import { ParcelService } from '../services/parcel.service';
import { ParcelImportService } from '../services/parcel-import.service';
import { ImageProcessingService } from '../services/image-processing.service';
import { ParcelImage } from '../entities/parcel-image.entity';
import { ListParcelsQueryDto } from '../dto/list-parcels-query.dto';
import { UpdateParcelDto } from '../dto/update-parcel.dto';
import { UpdateParcelStatusDto } from '../dto/update-parcel-status.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parcel } from '../entities/parcel.entity';
import { Favorite } from '../entities/favorite.entity';
import { NotificationService } from '../../notifications/notification.service';

@Controller('admin/parcels')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminParcelController {
  constructor(
    private readonly parcelService: ParcelService,
    private readonly importService: ParcelImportService,
    private readonly imageProcessingService: ImageProcessingService,
    @InjectRepository(Parcel)
    private readonly parcelRepo: Repository<Parcel>,
    @InjectRepository(ParcelImage)
    private readonly imageRepo: Repository<ParcelImage>,
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,
    private readonly notifications: NotificationService,
  ) {}

  private async notifyFavoritesOfPriceChange(
    parcelId: string,
    parcelTitle: string,
    oldPrice: number,
    newPrice: number,
  ): Promise<void> {
    if (oldPrice === newPrice) return;
    const dir = newPrice < oldPrice ? 'düştü' : 'arttı';
    const oldFmt = oldPrice.toLocaleString('tr-TR');
    const newFmt = newPrice.toLocaleString('tr-TR');
    const body = `Favorilerinizdeki "${parcelTitle}" ilanının fiyatı ${oldFmt} ₺'den ${newFmt} ₺'ye ${dir}.`;
    const favorites = await this.favoriteRepo.find({ where: { parcelId } });
    for (const fav of favorites) {
      try {
        await Promise.all([
          this.notifications.enqueue({
            userId: fav.userId,
            channel: 'push',
            subject: 'Favori ilanında fiyat değişti',
            body,
            metadata: { type: 'favorite.price_change', parcelId, oldPrice, newPrice },
          }),
          this.notifications.enqueue({
            userId: fav.userId,
            channel: 'email',
            subject: `Favori ilanında fiyat ${dir}`,
            body,
            metadata: { type: 'favorite.price_change', parcelId, oldPrice, newPrice },
          }),
        ]);
      } catch {
        // best-effort
      }
    }
  }

  /** List all parcels (admin view — includes drafts, withdrawn, etc.) */
  @Get()
  async findAll(@Query() query: ListParcelsQueryDto) {
    return this.parcelService.findAll(query);
  }

  /** Export parcels — `?format=csv` (default, BOM'lu) or `?format=xlsx` (native Excel) */
  @Get('export')
  async exportParcels(
    @Res() res: Response,
    @Query('format') format?: string,
  ) {
    const parcels = await this.parcelRepo.find({
      order: { createdAt: 'DESC' },
      take: 10000,
    });

    const headerKeys = [
      'listing_id', 'title', 'status', 'city', 'district', 'neighborhood',
      'ada', 'parsel', 'area_m2', 'price', 'currency', 'price_per_m2',
      'zoning_status', 'land_type', 'latitude', 'longitude',
      'is_featured', 'is_auction_eligible', 'created_at',
    ] as const;

    const headerLabels: Record<typeof headerKeys[number], string> = {
      listing_id: 'İlan No',
      title: 'Başlık',
      status: 'Durum',
      city: 'İl',
      district: 'İlçe',
      neighborhood: 'Mahalle',
      ada: 'Ada',
      parsel: 'Parsel',
      area_m2: 'Alan (m²)',
      price: 'Fiyat',
      currency: 'Para Birimi',
      price_per_m2: 'm² Fiyatı',
      zoning_status: 'İmar Durumu',
      land_type: 'Arazi Tipi',
      latitude: 'Enlem',
      longitude: 'Boylam',
      is_featured: 'Öne Çıkan',
      is_auction_eligible: 'İhaleye Uygun',
      created_at: 'Oluşturma Tarihi',
    };

    const rowFor = (p: Parcel): Record<string, string | number | boolean> => ({
      listing_id: p.listingId,
      title: p.title || '',
      status: p.status,
      city: p.city,
      district: p.district,
      neighborhood: p.neighborhood || '',
      ada: p.ada || '',
      parsel: p.parsel || '',
      area_m2: p.areaM2 ? Number(p.areaM2) : '',
      price: p.price ? Number(p.price) : '',
      currency: p.currency,
      price_per_m2: p.pricePerM2 ? Number(p.pricePerM2) : '',
      zoning_status: p.zoningStatus || '',
      land_type: p.landType || '',
      latitude: p.latitude || '',
      longitude: p.longitude || '',
      is_featured: p.isFeatured,
      is_auction_eligible: p.isAuctionEligible,
      created_at: p.createdAt?.toISOString() || '',
    });

    const today = new Date().toISOString().slice(0, 10);

    if (format === 'xlsx') {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'NetTapu Admin';
      workbook.created = new Date();
      const sheet = workbook.addWorksheet('Arsalar', {
        views: [{ state: 'frozen', ySplit: 1 }],
      });

      sheet.columns = headerKeys.map((k) => ({
        header: headerLabels[k],
        key: k,
        width: Math.max(12, headerLabels[k].length + 4),
      }));

      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE5E7EB' },
      };

      for (const p of parcels) {
        sheet.addRow(rowFor(p));
      }

      sheet.getColumn('price').numFmt = '#,##0.00';
      sheet.getColumn('price_per_m2').numFmt = '#,##0.00';
      sheet.getColumn('area_m2').numFmt = '#,##0.00';

      const buffer = await workbook.xlsx.writeBuffer();
      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="parcels-export-${today}.xlsx"`,
      });
      res.end(Buffer.from(buffer));
      return;
    }

    // Default: CSV with BOM (Excel-friendly Turkish chars)
    const csvRows = [headerKeys.map((k) => headerLabels[k]).join(',')];
    for (const p of parcels) {
      const row = rowFor(p);
      const cells = headerKeys.map((k) => {
        const v = row[k];
        if (v === null || v === undefined || v === '') return '';
        const s = typeof v === 'string' ? v : String(v);
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      });
      csvRows.push(cells.join(','));
    }
    const csv = csvRows.join('\n');
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="parcels-export-${today}.csv"`,
    });
    res.send('﻿' + csv);
  }

  /** Bulk price adjustment (percentage-based) */
  @Post('bulk-price-update')
  @HttpCode(HttpStatus.OK)
  async bulkPriceUpdate(
    @Body()
    body: {
      /** Preferred field name; also accepted: percentageIncrease */
      percentage?: number;
      percentageIncrease?: number;
      /** Optional: nearest TL to round to (e.g. 1000 → round to nearest 1000) */
      roundUpTo?: number;
      /** Limit to explicit parcel ids — overrides filters when present */
      parcelIds?: string[];
      filters?: {
        city?: string;
        district?: string;
        neighborhood?: string;
        status?: string;
        zoningStatus?: string;
        parcelType?: string;
        minPrice?: number;
        maxPrice?: number;
        minArea?: number;
        maxArea?: number;
      };
    },
    @CurrentUser() _user: JwtPayload,
  ) {
    const pct = body.percentage ?? body.percentageIncrease;
    if (typeof pct !== 'number' || pct === 0 || Number.isNaN(pct)) {
      throw new BadRequestException('percentage must be a non-zero number');
    }
    if (Math.abs(pct) > 50) {
      throw new BadRequestException('Percentage change cannot exceed ±50%');
    }

    const qb = this.parcelRepo.createQueryBuilder('p');
    qb.where('p.price IS NOT NULL');

    if (body.parcelIds && body.parcelIds.length > 0) {
      qb.andWhere('p.id IN (:...ids)', { ids: body.parcelIds });
    } else if (body.filters) {
      const f = body.filters;
      if (f.city) qb.andWhere('p.city = :city', { city: f.city });
      if (f.district) qb.andWhere('p.district = :district', { district: f.district });
      if (f.neighborhood) qb.andWhere('p.neighborhood = :neighborhood', { neighborhood: f.neighborhood });
      if (f.status) qb.andWhere('p.status = :status', { status: f.status });
      if (f.zoningStatus) qb.andWhere('p.zoning_status = :zoningStatus', { zoningStatus: f.zoningStatus });
      if (f.parcelType) qb.andWhere('p.land_type = :landType', { landType: f.parcelType });
      if (f.minPrice != null) qb.andWhere('p.price::numeric >= :minPrice', { minPrice: f.minPrice });
      if (f.maxPrice != null) qb.andWhere('p.price::numeric <= :maxPrice', { maxPrice: f.maxPrice });
      if (f.minArea != null) qb.andWhere('p.area_m2::numeric >= :minArea', { minArea: f.minArea });
      if (f.maxArea != null) qb.andWhere('p.area_m2::numeric <= :maxArea', { maxArea: f.maxArea });
    } else {
      throw new BadRequestException('Either parcelIds or filters must be provided');
    }

    const parcels = await qb.getMany();
    const multiplier = 1 + pct / 100;
    const roundTo = body.roundUpTo && body.roundUpTo > 0 ? body.roundUpTo : 0;
    let updated = 0;

    for (const parcel of parcels) {
      if (parcel.price) {
        const oldPrice = parseFloat(parcel.price as any);
        let newPrice = oldPrice * multiplier;
        if (roundTo > 0) {
          newPrice = Math.ceil(newPrice / roundTo) * roundTo;
        } else {
          newPrice = Math.round(newPrice * 100) / 100;
        }
        await this.parcelRepo.update(parcel.id, {
          price: newPrice as any,
          pricePerM2: parcel.areaM2
            ? (Math.round((newPrice / parseFloat(parcel.areaM2 as any)) * 100) / 100) as any
            : parcel.pricePerM2,
        });
        updated++;
        // Notify users who favorited this parcel (fire-and-forget per parcel)
        await this.notifyFavoritesOfPriceChange(parcel.id, parcel.title || 'İlan', oldPrice, newPrice);
      }
    }

    return {
      message: `${updated} parsel fiyatı güncellendi`,
      totalMatched: parcels.length,
      totalUpdated: updated,
      percentage: pct,
    };
  }

  /** Reprocess all images (regenerate watermarks + thumbnails) */
  @Post('reprocess-images')
  @HttpCode(HttpStatus.OK)
  async reprocessImages() {
    const images = await this.imageRepo.find({ where: { status: 'ready' as any } });
    let success = 0;
    let failed = 0;
    for (const img of images) {
      try {
        await this.imageProcessingService.processImage(img.id);
        success++;
      } catch {
        failed++;
      }
    }
    return { message: `${success} image reprocessed, ${failed} failed`, total: images.length, success, failed };
  }

  /** Get a single parcel by ID */
  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.parcelService.findById(id);
  }

  /** Update parcel fields */
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateParcelDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.parcelService.update(id, dto, user.sub);
  }

  /** Update parcel status */
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateParcelStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.parcelService.updateStatus(id, dto, user.sub);
  }

  /** Download a sample CSV showing required columns for `POST /admin/parcels/import` */
  @Get('import-template')
  async importTemplate(@Res() res: Response, @Query('format') format?: string) {
    const headers = [
      'title', 'description', 'city', 'district', 'neighborhood',
      'ada', 'parsel', 'area_m2', 'price', 'currency',
      'zoning_status', 'land_type', 'latitude', 'longitude',
      'is_featured', 'is_auction_eligible', 'deed_type', 'vat_rate', 'road_access',
      'video_url', 'embed_code', 'guide_url',
    ];
    const sample = [
      'Antalya Manavgat Sahil Arsası', 'Denize 200m, imarlı arsa', 'Antalya', 'Manavgat',
      'Sorgun', '1234', '56', '750', '2500000', 'TRY',
      'İmarlı', 'arsa', '36.7783', '31.4419',
      'true', 'false', 'mustakil', '20', 'yes',
      'https://youtube.com/watch?v=...', '', 'https://nettapu.tunasoft.tech/rehber/antalya',
    ];
    if (format === 'xlsx') {
      const ExcelJS = await import('exceljs');
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Arsa İçe Aktarma');
      ws.addRow(headers);
      ws.addRow(sample);
      ws.getRow(1).font = { bold: true };
      const buffer = await wb.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="arsa-import-ornek.xlsx"');
      res.send(Buffer.from(buffer));
      return;
    }
    const csv =
      '﻿' +
      [headers.join(','), sample.map((v) => (/[,"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(',')].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="arsa-import-ornek.csv"');
    res.send(csv);
  }

  /** Import parcels from CSV / XLSX / XLS */
  @Post('import')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    }),
  )
  async importParcels(
    @UploadedFile() file: Express.Multer.File,
    @Query('dryRun') dryRunStr?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    if (!file) {
      throw new BadRequestException('Parcel file is required (CSV / XLSX / XLS)');
    }

    const lower = file.originalname.toLowerCase();
    const isCsv = lower.endsWith('.csv');
    const isXlsx = lower.endsWith('.xlsx') || lower.endsWith('.xls');
    const mimeOk =
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype.includes('spreadsheetml') ||
      file.mimetype === 'application/octet-stream'; // some browsers send this for xlsx
    if (!isCsv && !isXlsx && !mimeOk) {
      throw new BadRequestException(
        'Only CSV, XLSX or XLS files are accepted',
      );
    }

    const dryRun = dryRunStr === 'true';
    return this.importService.importFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      user!.sub,
      dryRun,
    );
  }
}
