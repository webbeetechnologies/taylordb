import { AbstractLinkColumn } from './internal-types';

export type NonLinkColumnNames<T> = {
  [K in keyof T]: T[K] extends AbstractLinkColumn ? never : K;
}[keyof T];

export type LinkColumnNames<T> = {
  [K in keyof T]: T[K] extends AbstractLinkColumn ? K : never;
}[keyof T];

export type ColumnNames<T> = keyof T;
