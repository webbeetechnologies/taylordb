import { ColumnType } from '@taylordb/shared';
import { AbstractLinkColumn } from './internal-types';

export type TableNames<DB> = {
  [K in keyof DB]: DB[K] extends Record<string, any>
    ? keyof DB[K] extends never
      ? never
      : DB[K][keyof DB[K]] extends ColumnType<any, any, any, any, any, any>
        ? K
        : never
    : never;
}[keyof DB];

export type NonLinkColumnNames<T> = {
  [K in keyof T]: T[K] extends AbstractLinkColumn ? never : K;
}[keyof T];

export type LinkColumnNames<T> = {
  [K in keyof T]: T[K] extends AbstractLinkColumn ? K : never;
}[keyof T];

export type ColumnNames<T> = keyof T;
