import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { TkgmCache } from '../entities/tkgm-cache.entity';
import { ExternalApiLogService } from './external-api-log.service';
import { TkgmLookupDto } from '../dto/tkgm-lookup.dto';

const TKGM_BASE = 'https://cbsapi.tkgm.gov.tr/megsiswebapi.v3.1/api';
const TKGM_TIMEOUT = 15_000;

interface TkgmIl { id: number; text: string }
interface TkgmIlce { id: number; text: string }
interface TkgmMahalle { id: number; text: string }
interface TkgmFeatureCollection<T> {
  type: string;
  features: Array<{ type: string; properties: T; geometry?: unknown }>;
}

@Injectable()
export class TkgmService {
  private readonly logger = new Logger(TkgmService.name);
  private static readonly CACHE_TTL_HOURS = 24;

  // In-memory code caches (rarely change)
  private ilListCache: TkgmIl[] = [];

  constructor(
    @InjectRepository(TkgmCache)
    private readonly cacheRepo: Repository<TkgmCache>,
    private readonly apiLogService: ExternalApiLogService,
  ) {}

  async lookup(dto: TkgmLookupDto): Promise<TkgmCache> {
    const cached = await this.cacheRepo.findOne({
      where: {
        city: dto.city,
        district: dto.district,
        ada: dto.ada,
        parsel: dto.parsel,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (cached) {
      this.logger.debug(`TKGM cache hit: ${dto.city}/${dto.district} ${dto.ada}/${dto.parsel}`);
      return cached;
    }

    return this.fetchAndCache(dto);
  }

  private async tkgmFetch<T>(url: string): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TKGM_TIMEOUT);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json', 'User-Agent': 'NetTapu/1.0' },
      });
      if (!res.ok) throw new Error(`TKGM ${res.status} ${res.statusText}`);
      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  private normalize(s: string): string {
    return s
      .toLocaleLowerCase('tr-TR')
      .replace(/İ/g, 'i').replace(/I/g, 'ı')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
      .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
      .trim();
  }

  private extractFeatures<T>(fc: TkgmFeatureCollection<T>): T[] {
    if (fc && Array.isArray(fc.features)) {
      return fc.features.map((f) => f.properties);
    }
    return [];
  }

  private async getIlKod(cityName: string): Promise<number> {
    if (this.ilListCache.length === 0) {
      const fc = await this.tkgmFetch<TkgmFeatureCollection<TkgmIl>>(`${TKGM_BASE}/idariYapi/ilListe`);
      this.ilListCache = this.extractFeatures(fc);
    }
    const norm = this.normalize(cityName);
    const il = this.ilListCache.find((i) => this.normalize(i.text) === norm);
    if (!il) throw new BadGatewayException(`TKGM: İl bulunamadı: ${cityName}`);
    return il.id;
  }

  private async getIlceKod(ilKod: number, districtName: string): Promise<number> {
    const fc = await this.tkgmFetch<TkgmFeatureCollection<TkgmIlce>>(`${TKGM_BASE}/idariYapi/ilceListe/${ilKod}`);
    const list = this.extractFeatures(fc);
    const norm = this.normalize(districtName);
    const ilce = list.find((i) => this.normalize(i.text) === norm);
    if (!ilce) throw new BadGatewayException(`TKGM: İlçe bulunamadı: ${districtName}`);
    return ilce.id;
  }

  private async getMahalleler(ilceKod: number): Promise<TkgmMahalle[]> {
    const fc = await this.tkgmFetch<TkgmFeatureCollection<TkgmMahalle>>(`${TKGM_BASE}/idariYapi/mahalleListe/${ilceKod}`);
    return this.extractFeatures(fc);
  }

  private async fetchAndCache(dto: TkgmLookupDto): Promise<TkgmCache> {
    const startMs = Date.now();
    let responseData: Record<string, unknown>;
    let httpStatus = 200;

    try {
      // 1. Resolve administrative codes
      const ilKod = await this.getIlKod(dto.city);
      const ilceKod = await this.getIlceKod(ilKod, dto.district);
      const mahalleler = await this.getMahalleler(ilceKod);

      // 2. Try each mahalle in PARALLEL batches (TKGM API needs mahalleKod for parsel lookup).
      //    Sequential loop on 50+ mahalle would take 50+ seconds (request timeout).
      //    Batch of 10 with Promise.allSettled keeps total time ~5s for not-found, ~1s for found.
      let parcelData: Record<string, unknown> | null = null;
      let foundMahalle = '';

      const extractFeature = (data: any): Record<string, unknown> | null => {
        if (!data || typeof data !== 'object') return null;
        if (data.type === 'FeatureCollection' && Array.isArray(data.features) && data.features.length > 0) return data.features[0];
        if (data.type === 'Feature') return data;
        if (Array.isArray(data.features) && data.features.length > 0) return data.features[0];
        if (Object.keys(data).length > 0) return data;
        return null;
      };

      const BATCH = 10;
      outer: for (let i = 0; i < mahalleler.length; i += BATCH) {
        const batch = mahalleler.slice(i, i + BATCH);
        const results = await Promise.allSettled(
          batch.map((mah) =>
            this.tkgmFetch<Record<string, unknown>>(`${TKGM_BASE}/parsel/${mah.id}/${dto.ada}/${dto.parsel}`)
              .then((d) => ({ mah, feature: extractFeature(d) })),
          ),
        );
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value.feature) {
            parcelData = r.value.feature;
            foundMahalle = r.value.mah.text;
            break outer;
          }
        }
      }

      if (!parcelData) {
        // Return empty/not-found cache entry (200 OK) instead of throwing 502
        responseData = {
          source: 'tkgm',
          found: false,
          ada: dto.ada,
          parsel: dto.parsel,
          city: dto.city,
          district: dto.district,
          latitude: null,
          longitude: null,
          boundary: null,
          fetchedAt: new Date().toISOString(),
        };

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // cache 2h for not-found
        const existingNF = await this.cacheRepo.findOne({
          where: { city: dto.city, district: dto.district, ada: dto.ada, parsel: dto.parsel },
        });
        if (existingNF) {
          existingNF.responseData = responseData;
          existingNF.fetchedAt = now;
          existingNF.expiresAt = expiresAt;
          return this.cacheRepo.save(existingNF);
        }
        const entry = this.cacheRepo.create({
          ada: dto.ada, parsel: dto.parsel, city: dto.city, district: dto.district,
          responseData, fetchedAt: now, expiresAt,
        });
        return this.cacheRepo.save(entry);
      }

      // 3. Extract useful data
      const geometry = parcelData.geometry as Record<string, unknown> | undefined;
      // TKGM sometimes wraps in Feature (parcelData.properties), sometimes returns raw props directly
      const properties = (parcelData.properties as Record<string, unknown> | undefined) ?? parcelData;
      const alanRaw = properties?.alan ?? parcelData.alan;
      // Parse Turkish number format: "100.301,93" → 100301.93
      const alan = typeof alanRaw === 'string'
        ? Number(alanRaw.replace(/\./g, '').replace(',', '.'))
        : alanRaw;

      // Calculate centroid from coordinates if available
      let latitude: number | null = null;
      let longitude: number | null = null;
      let boundary: unknown = null;

      const extractCentroid = (geom: Record<string, unknown>): { lat: number; lng: number } | null => {
        if (geom.type === 'Polygon' && Array.isArray(geom.coordinates)) {
          const ring = (geom.coordinates as number[][][])[0];
          if (ring?.length > 0) {
            let sumLat = 0, sumLng = 0;
            for (const [lng, lat] of ring) { sumLng += lng; sumLat += lat; }
            return { lat: sumLat / ring.length, lng: sumLng / ring.length };
          }
        }
        if (geom.type === 'MultiPolygon' && Array.isArray(geom.coordinates)) {
          const ring = (geom.coordinates as number[][][][])[0]?.[0];
          if (ring?.length > 0) {
            let sumLat = 0, sumLng = 0;
            for (const [lng, lat] of ring) { sumLng += lng; sumLat += lat; }
            return { lat: sumLat / ring.length, lng: sumLng / ring.length };
          }
        }
        return null;
      };

      if (geometry && (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon')) {
        boundary = geometry;
        const c = extractCentroid(geometry);
        if (c) { latitude = c.lat; longitude = c.lng; }
      }

      // Fallback: parse gittigiParselListe (TKGM stores moved parcel geometry here)
      if (!boundary) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const gpl: any = (properties as any)?.gittigiParselListe;
          if (gpl) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const raw: any = typeof gpl === 'string' ? JSON.parse(gpl) : gpl;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const gplFeature: any = Array.isArray(raw?.features) ? raw.features[0] : null;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const geom: any = gplFeature?.geometry;
            if (geom && (geom.type === 'Polygon' || geom.type === 'MultiPolygon')) {
              boundary = geom as Record<string, unknown>;
              const c = extractCentroid(geom as Record<string, unknown>);
              if (c) { latitude = c.lat; longitude = c.lng; }
            }
          }
        } catch { /* ignore parse errors */ }
      }

      responseData = {
        source: 'tkgm',
        ada: dto.ada,
        parsel: dto.parsel,
        city: dto.city,
        district: dto.district,
        neighborhood: foundMahalle,
        areaM2: alan ? Number(alan) : null,
        nitelik: properties?.nitelik ?? null,
        pafta: properties?.pafta ?? null,
        mevkii: properties?.mevkii ?? null,
        latitude,
        longitude,
        boundary,
        rawProperties: properties ?? {},
        fetchedAt: new Date().toISOString(),
      };
    } catch (err) {
      httpStatus = err instanceof BadGatewayException ? 404 : 502;
      const durationMs = Date.now() - startMs;

      await this.apiLogService.record({
        provider: 'tkgm',
        endpoint: `/api/parcel/${dto.city}/${dto.district}/${dto.ada}/${dto.parsel}`,
        method: 'GET',
        requestPayload: dto as unknown as Record<string, unknown>,
        responseStatus: httpStatus,
        responsePayload: { error: (err as Error).message },
        durationMs,
      });

      throw err;
    }

    const durationMs = Date.now() - startMs;

    await this.apiLogService.record({
      provider: 'tkgm',
      endpoint: `/api/parcel/${dto.city}/${dto.district}/${dto.ada}/${dto.parsel}`,
      method: 'GET',
      requestPayload: dto as unknown as Record<string, unknown>,
      responseStatus: httpStatus,
      responsePayload: responseData,
      durationMs,
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + TkgmService.CACHE_TTL_HOURS * 60 * 60 * 1000);

    // Upsert: if a row already exists for this (city, district, ada, parsel),
    // overwrite it with the fresh data. The unique constraint
    // tkgm_cache_parcel_unique blocks plain INSERT on duplicates.
    const existing = await this.cacheRepo.findOne({
      where: { city: dto.city, district: dto.district, ada: dto.ada, parsel: dto.parsel },
    });

    let saved: TkgmCache;
    if (existing) {
      existing.responseData = responseData;
      existing.fetchedAt = now;
      existing.expiresAt = expiresAt;
      saved = await this.cacheRepo.save(existing);
    } else {
      const entry = this.cacheRepo.create({
        ada: dto.ada, parsel: dto.parsel, city: dto.city, district: dto.district,
        responseData, fetchedAt: now, expiresAt,
      });
      saved = await this.cacheRepo.save(entry);
    }
    this.logger.log(`TKGM fetched & cached: ${dto.city}/${dto.district} ${dto.ada}/${dto.parsel} (${durationMs}ms)`);
    return saved;
  }

  async invalidateCache(city: string, district: string, ada: string, parsel: string): Promise<number> {
    const result = await this.cacheRepo.delete({ city, district, ada, parsel });
    return result.affected ?? 0;
  }
}
