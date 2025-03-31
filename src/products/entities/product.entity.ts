import { Category } from 'src/interfaces/category.interface';
import { Unit } from 'src/interfaces/unit.interface';
import {
  Check,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductImg } from './product-img.entity';

@Entity({ name: 'products' })
@Check('"price" >= 0')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { unique: true })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ type: 'decimal', default: 0 })
  price: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'text', default: Unit.cu, enum: Unit })
  unit: string;

  @Column({ type: 'text', default: Category.Construccion, enum: Category })
  category: Category;

  // Relación uno a muchos con Imagen
  @OneToMany(() => ProductImg, (productImg) => productImg.product, {
    cascade: true,
  })
  images: ProductImg[];
}
