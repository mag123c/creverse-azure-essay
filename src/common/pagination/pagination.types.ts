export interface OffsetPaginateResult<T> {
  data: T[];
  meta: {
    total: number;
    currentPage: number;
    perPage: number;
    hasNext: boolean;
  };
}

export interface CursorPaginateResult<T> {
  data: T[];
  meta: {
    perPage: number;
    nextCursor?: string;
    hasNext: boolean;
  };
}
