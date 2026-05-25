import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

export interface CategoryNode {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  children: CategoryNode[];
}

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
  ) {}

  async list(includeInactive = false): Promise<Category[]> {
    const where = includeInactive ? {} : { isActive: true };
    return this.repo.find({ where, order: { sortOrder: 'ASC', name: 'ASC' } });
  }

  async tree(includeInactive = false): Promise<CategoryNode[]> {
    const flat = await this.list(includeInactive);
    const map = new Map<string, CategoryNode>();
    for (const c of flat) {
      map.set(c.id, {
        id: c.id,
        parentId: c.parentId,
        name: c.name,
        slug: c.slug,
        description: c.description,
        sortOrder: c.sortOrder,
        isActive: c.isActive,
        children: [],
      });
    }
    const roots: CategoryNode[] = [];
    for (const node of map.values()) {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    const sortRec = (list: CategoryNode[]) => {
      list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'tr'));
      list.forEach((n) => sortRec(n.children));
    };
    sortRec(roots);
    return roots;
  }

  async findById(id: string): Promise<Category> {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Kategori bulunamadı');
    return c;
  }

  async create(dto: {
    parentId?: string | null;
    name: string;
    slug?: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<Category> {
    const slug = (dto.slug || this.slugify(dto.name)).toLowerCase();
    const parentId = dto.parentId ?? null;

    // Enforce unique (parentId, slug)
    const exists = await this.repo.findOne({
      where: { slug, parentId: parentId === null ? IsNull() : parentId },
    });
    if (exists) throw new ConflictException('Bu kategori adı/slug aynı seviyede zaten mevcut.');

    const cat = this.repo.create({
      parentId,
      name: dto.name,
      slug,
      description: dto.description ?? null,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    });
    return this.repo.save(cat);
  }

  async update(id: string, dto: {
    parentId?: string | null;
    name?: string;
    slug?: string;
    description?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<Category> {
    const cat = await this.findById(id);

    if (dto.parentId !== undefined) {
      if (dto.parentId === id) throw new ConflictException('Kategori kendisinin alt kategorisi olamaz.');
      cat.parentId = dto.parentId;
    }
    if (dto.name !== undefined) cat.name = dto.name;
    if (dto.slug !== undefined) cat.slug = dto.slug.toLowerCase();
    if (dto.description !== undefined) cat.description = dto.description;
    if (dto.sortOrder !== undefined) cat.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) cat.isActive = dto.isActive;

    return this.repo.save(cat);
  }

  async remove(id: string): Promise<void> {
    const cat = await this.findById(id);
    await this.repo.remove(cat);
  }

  private slugify(s: string): string {
    return s
      .toLocaleLowerCase('tr')
      .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
      .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120);
  }
}
