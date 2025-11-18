import { LinkColumnType } from '@taylordb/shared';

export type NonLinkColumnNames<T> = {
  [K in keyof T]: T[K] extends LinkColumnType<any, any> ? never : K;
}[keyof T];

export type LinkColumnNames<T> = {
  [K in keyof T]: T[K] extends LinkColumnType<any, any> ? K : never;
}[keyof T];

export type ColumnNames<T> = keyof T;
