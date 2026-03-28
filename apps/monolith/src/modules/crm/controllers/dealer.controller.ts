import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { DealerService } from '../services/dealer.service';
import { CreateDealerDto } from '../dto/create-dealer.dto';
import { UpdateDealerDto, UpdateDealerStatusDto } from '../dto/update-dealer.dto';

@Controller('admin/dealers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class DealerController {
  constructor(private readonly service: DealerService) {}

  @Get()
  async findAll(@Query('status') status?: string) {
    return this.service.findAll(status);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateDealerDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDealerDto,
  ) {
    return this.service.update(id, dto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDealerStatusDto,
  ) {
    return this.service.updateStatus(id, dto.status);
  }
}
