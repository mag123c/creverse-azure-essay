import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import type { OffsetPaginateResult } from './pagination.types';

export function applyOffsetPagination<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  page: number,
  take: number,
): SelectQueryBuilder<T> {
  const skip = (page - 1) * take;
  return qb.skip(skip).take(take);
}

export async function getOffsetPaginatedResult<T>(
  qb: SelectQueryBuilder<T & ObjectLiteral>,
  page: number,
  take: number,
): Promise<OffsetPaginateResult<T>> {
  const [data, total] = await qb.getManyAndCount();

  return {
    data,
    meta: {
      total,
      currentPage: page,
      perPage: take,
      hasNext: total > page * take,
    },
  };
}
