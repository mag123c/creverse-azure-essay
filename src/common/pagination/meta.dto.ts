import { ApiProperty } from '@nestjs/swagger';
import { PaginationMeta } from './pagination.interface';

export class PaginationMetaDto implements PaginationMeta {
  @ApiProperty({ description: '총 데이터 수', example: 100 })
  readonly total!: number;

  @ApiProperty({ description: '현재 페이지', example: 1 })
  currentPage!: number;

  @ApiProperty({ description: '페이지당 데이터 수', example: 20 })
  perPage!: number;

  @ApiProperty({ description: '다음 페이지 존재 여부', example: true })
  hasNext!: boolean;

  constructor({
    total,
    currentPage,
    perPage,
    hasNext,
  }: {
    total: number;
    currentPage: number;
    perPage: number;
    hasNext: boolean;
  }) {
    this.total = total;
    this.currentPage = currentPage;
    this.perPage = perPage;
    this.hasNext = hasNext;
  }

  static of({
    total,
    currentPage,
    perPage,
    hasNext,
  }: {
    total: number;
    currentPage: number;
    perPage: number;
    hasNext: boolean;
  }): PaginationMetaDto {
    return new PaginationMetaDto({
      total,
      currentPage,
      perPage,
      hasNext,
    });
  }
}
