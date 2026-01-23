import { SortType } from '@/constants';

export interface IPaginatedResponse<T> {
  items: T[];
  meta: IMeta;
}

export interface IMeta {
  limit: number;
  offset: number;
  total: number;
  totalPages: number;
}

export interface IError {
  message: string[];
  statusCode: number;
  path: string;
  timestamp: string;
}

export interface IQuery {
  queries?: {
    fieldName: string;
    value: string | number | boolean;
  }[];
  pagination?: {
    limit?: number;
    page?: number;
    offset?: number;
  };
  searches?: {
    fieldName: string;
    keyword: string;
  }[];
  order?: {
    sortBy: string;
    sortType: SortType;
  }[];
  rangeStringFilters?: {
    fieldName: string;
    eq?: string;
    ne?: string;
    gte?: string;
    in?: string[];
    lte?: string;
    gt?: string;
    lt?: string;
    nin?: string[];
  }[];
  rangeDateFilters?: {
    fieldName: string;
    eq?: Date;
    ne?: Date;
    gte?: Date;
    lte?: Date;
    gt?: Date;
    lt?: Date;
    in?: Date[];
    nin?: Date[];
  }[];
}
