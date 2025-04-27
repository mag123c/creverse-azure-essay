export interface PaginationRequest {
  page: number;
  size: number;
  sort?: string;
}

export interface PaginationMeta {
  total: number;
  currentPage: number;
  perPage: number;
  hasNext: boolean;
}

export interface OffsetPaginateResult<T> {
  data: T[];
  meta: PaginationMeta;
}
