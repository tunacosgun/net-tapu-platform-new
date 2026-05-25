import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { CategoryService } from '../services/category.service';

/** Public read-only endpoints for the category tree (used by parcel filters & picker). */
@Controller('categories')
export class CategoryController {
  constructor(private readonly service: CategoryService) {}

  @Get()
  async list() {
    return this.service.list(false);
  }

  @Get('tree')
  async tree() {
    return this.service.tree(false);
  }
}

/** Admin-only category management. */
@Controller('admin/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminCategoryController {
  constructor(private readonly service: CategoryService) {}

  @Get()
  async list(@Query('includeInactive') includeInactive?: string) {
    return this.service.list(includeInactive === 'true');
  }

  @Get('tree')
  async tree(@Query('includeInactive') includeInactive?: string) {
    return this.service.tree(includeInactive === 'true');
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: {
      parentId?: string | null;
      name: string;
      slug?: string;
      description?: string;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    return this.service.create(body);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: {
      parentId?: string | null;
      name?: string;
      slug?: string;
      description?: string | null;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.remove(id);
  }
}
