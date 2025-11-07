import { LinkColumnType } from '@taylordb/shared';

export type NonLinkColumnNames<T> = {
  [K in keyof T]: T[K] extends LinkColumnType<any> ? never : K;
}[keyof T];

export type LinkColumnNames<T> = {
  [K in keyof T]: T[K] extends LinkColumnType<any> ? K : never;
}[keyof T];
