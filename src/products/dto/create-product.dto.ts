import {
  IsString,
  MinLength,
  IsOptional,
  IsNumber,
  IsPositive,
  IsInt,
  Min,
  IsNotEmpty,
  isNotEmpty,
  IsEnum,
  IsArray,
} from 'class-validator';
import { Category } from 'src/interfaces/category.interface';
import { Unit } from 'src/interfaces/unit.interface';

export class CreateProductDto {
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio.' })
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;

  @IsNotEmpty({ message: 'El stock es obligatorio.' })
  @IsInt()
  @Min(0)
  stock: number;

  @IsNotEmpty()
  @IsEnum(Unit, { message: 'Debe ser una unidad Valida' })
  unit: Unit;

  @IsNotEmpty()
  @IsEnum(Category, {
    message: `Debe ser una categoria Valida: ${Category.Construccion} ${Category.Ambiental} ${Category.Muebles} ${Category.Vial}`,
  })
  category: Category;

  @IsString({ each: true }) // cada propiedad es un string
  @IsArray() // array
  @IsOptional()
  images?: string[];
}
