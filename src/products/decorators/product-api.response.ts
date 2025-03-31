import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { Product } from '../entities/product.entity';

export function ProductPostResponse() {
  return applyDecorators(
    ApiResponse({
      status: 201,
      description: 'Product Created!',
      type: Product,
    }),
    ApiResponse({ status: 400, description: 'Bad Request!' }),
    ApiResponse({ status: 403, description: 'Forbidden!!' }),
  );
}

export function ProductGetResponse() {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: 'Get Product',
      type: Product,
    }),
    ApiResponse({ status: 404, description: 'Product Not Found!' }),
    ApiResponse({ status: 403, description: 'Forbidden!!' }),
  );
}
