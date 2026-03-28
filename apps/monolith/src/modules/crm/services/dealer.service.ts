import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dealer } from '../entities/dealer.entity';
import { CreateDealerDto } from '../dto/create-dealer.dto';
import { UpdateDealerDto } from '../dto/update-dealer.dto';

@Injectable()
export class DealerService {
  private readonly logger = new Logger(DealerService.name);

  constructor(
    @InjectRepository(Dealer)
    private readonly repo: Repository<Dealer>,
  ) {}

  async findAll(status?: string) {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      meta: { total, page: 1, limit: total, totalPages: 1 },
    };
  }

  async findOne(id: string): Promise<Dealer> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Dealer ${id} not found`);
    }
    return entity;
  }

  async create(dto: CreateDealerDto): Promise<Dealer> {
    const entity = this.repo.create({
      email: dto.email,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      phone: dto.phone ?? null,
      commissionRate: dto.commissionRate ?? 2.5,
      userId: dto.userId ?? null,
      status: 'active',
    });

    const saved = await this.repo.save(entity);
    this.logger.log(`Dealer created: ${saved.id} email=${saved.email}`);
    return saved;
  }

  async update(id: string, dto: UpdateDealerDto): Promise<Dealer> {
    const entity = await this.findOne(id);

    if (dto.email !== undefined) entity.email = dto.email;
    if (dto.firstName !== undefined) entity.firstName = dto.firstName;
    if (dto.lastName !== undefined) entity.lastName = dto.lastName;
    if (dto.phone !== undefined) entity.phone = dto.phone;
    if (dto.commissionRate !== undefined) entity.commissionRate = dto.commissionRate;
    if (dto.userId !== undefined) entity.userId = dto.userId;

    const saved = await this.repo.save(entity);
    this.logger.log(`Dealer ${id} updated`);
    return saved;
  }

  async updateStatus(id: string, status: string): Promise<Dealer> {
    const entity = await this.findOne(id);
    entity.status = status;
    const saved = await this.repo.save(entity);
    this.logger.log(`Dealer ${id} status changed to ${status}`);
    return saved;
  }
}
