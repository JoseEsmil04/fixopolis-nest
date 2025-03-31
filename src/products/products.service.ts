import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { validate as isUUID } from 'uuid';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { ProductImg } from './entities/product-img.entity';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(ProductImg)
    private readonly productImgRepository: Repository<ProductImg>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const { images = [], ...productData } = createProductDto;
    try {
      const product = this.productsRepository.create({
        ...productData,
        images: images.map((url) => this.productImgRepository.create({ url })),
      });
      await this.productsRepository.save(product);

      return product;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    const [products, count] = await this.productsRepository.findAndCount({
      take: limit,
      skip: offset,
      relations: {
        images: true,
      },
    });

    return {
      totalProducts: count,
      products: products.map((product) => ({
        ...product,
        images: product.images.map((img) => img.url), // Mapeo para barrer los id de las img
      })),
    };
  }

  async findBy(parameter: string) {
    let product: Product;

    if (isUUID(parameter)) {
      product = (await this.productsRepository.findOneBy({
        id: parameter,
      })) as Product;
    } else {
      const queryBuilder = this.productsRepository.createQueryBuilder('prod'); // QueryBuilder para hacer querys

      product = (await queryBuilder // Para evitar SQL Injections
        .where('LOWER(name) = LOWER(:name)', {
          name: parameter,
          category: parameter,
        })
        .leftJoinAndSelect('prod.images', 'prodImages') // Propiedad y Apodo
        .getOne()) as Product;
    }

    if (!product) {
      throw new NotFoundException(`Product with term: ${parameter} not Found!`);
    }

    return product;
  }

  async findByClean(parameter: string) {
    const product = await this.findBy(parameter);

    return {
      ...product,
      images: product.images?.map((img) => img.url) || [],
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { images, ...toUpdate } = updateProductDto;

    const product = await this.productsRepository.preload({
      id,
      ...toUpdate,
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (images) {
        await queryRunner.manager.delete(ProductImg, { product: { id } });

        product.images = images.map((url) =>
          this.productImgRepository.create({ url }),
        );
      }

      await queryRunner.manager.save(product);
      await queryRunner.commitTransaction();

      return await this.findByClean(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.handleDBExceptions(error);
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string) {
    const product = await this.productsRepository.findOneBy({
      id,
    });

    if (!product) throw new NotFoundException('Producto no Encontrado!');

    await this.productsRepository.delete({
      id: product.id,
    });

    return {
      message: 'Deleted',
      product: product.name,
    };
  }

  async deleteAllProducts() {
    const query = this.productsRepository.createQueryBuilder('product');

    try {
      return await query.delete().where({}).execute();
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  public handleDBExceptions(error: any) {
    // Unique Constraint error
    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    }

    this.logger.error(error);
    throw new InternalServerErrorException('Internal Server Error - Check Log');
  }
}
