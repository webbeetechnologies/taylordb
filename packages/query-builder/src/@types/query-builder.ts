import { ALinkColumnType } from '@taylordb/shared';

export type NonLinkColumnNames<T> = {
  [K in keyof T]: T[K] extends ALinkColumnType<any, any, any, any, boolean>
    ? never
    : K;
}[keyof T];

export type LinkColumnNames<T> = {
  [K in keyof T]: T[K] extends ALinkColumnType<any, any, any, any, boolean>
    ? K
    : never;
}[keyof T];

export type ColumnNames<T> = keyof T;
