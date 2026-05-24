import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

type LocationData = Record<string, Record<string, string[]>>;

@Injectable()
export class LocationsService {
  private readonly data: LocationData;

  constructor() {
    const filePath = path.join(__dirname, 'turkey_locations.json');
    this.data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  getCities(q?: string, limit?: number): string[] {
    const all = Object.keys(this.data).sort((a, b) => a.localeCompare(b, 'tr'));
    return this.filterAndLimit(all, q, limit);
  }

  getDistricts(city: string, q?: string, limit?: number): string[] {
    const districts = this.data[city];
    if (!districts) return [];
    const all = Object.keys(districts).sort((a, b) => a.localeCompare(b, 'tr'));
    return this.filterAndLimit(all, q, limit);
  }

  getNeighborhoods(city: string, district: string, q?: string, limit?: number): string[] {
    const districts = this.data[city];
    if (!districts) return [];
    const neighborhoods = districts[district];
    if (!neighborhoods) return [];
    const all = [...neighborhoods].sort((a, b) => a.localeCompare(b, 'tr'));
    return this.filterAndLimit(all, q, limit);
  }

  private filterAndLimit(items: string[], q?: string, limit?: number): string[] {
    let result = items;
    if (q && q.trim()) {
      const needle = this.normalize(q.trim());
      const startsWith: string[] = [];
      const contains: string[] = [];
      for (const item of items) {
        const norm = this.normalize(item);
        if (norm.startsWith(needle)) startsWith.push(item);
        else if (norm.includes(needle)) contains.push(item);
      }
      result = [...startsWith, ...contains];
    }
    if (limit && limit > 0) result = result.slice(0, limit);
    return result;
  }

  private normalize(s: string): string {
    return s
      .toLocaleLowerCase('tr')
      .replace(/ı/g, 'i')
      .replace(/ş/g, 's')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');
  }
}
