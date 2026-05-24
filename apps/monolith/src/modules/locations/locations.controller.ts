import { Controller, Get, Query } from '@nestjs/common';
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('cities')
  getCities(@Query('q') q?: string, @Query('limit') limit?: string) {
    return this.locationsService.getCities(q, limit ? parseInt(limit, 10) : undefined);
  }

  @Get('districts')
  getDistricts(
    @Query('city') city: string,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ) {
    if (!city) return [];
    return this.locationsService.getDistricts(city, q, limit ? parseInt(limit, 10) : undefined);
  }

  @Get('neighborhoods')
  getNeighborhoods(
    @Query('city') city: string,
    @Query('district') district: string,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ) {
    if (!city || !district) return [];
    return this.locationsService.getNeighborhoods(city, district, q, limit ? parseInt(limit, 10) : undefined);
  }
}
