import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import type { CursorPaginateResult } from './pagination.types';

export function applyCursorPagination<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  field: keyof T,
  cursor: string | number | undefined,
  limit: number,
): SelectQueryBuilder<T> {
  if (cursor) {
    qb.andWhere(`${qb.alias}.${String(field)} < :cursor`, { cursor });
  }
  return qb.orderBy(`${qb.alias}.${String(field)}`, 'DESC').take(limit);
}

export async function getCursorPaginatedResult<T>(
  qb: SelectQueryBuilder<T & ObjectLiteral>,
  limit: number,
  field: keyof T,
): Promise<CursorPaginateResult<T>> {
  const data = await qb.getMany();
  const lastItem = data[data.length - 1];

  return {
    data,
    meta: {
      perPage: limit,
      nextCursor: lastItem ? String(lastItem[field]) : undefined,
      hasNext: data.length === limit,
    },
  };
}
