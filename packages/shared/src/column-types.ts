/**
 * Copyright (c) 2025 TaylorDB
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type ColumnType<S, U, I, T> = {
  raw: S;
  insert: I;
  update: U;
  type: T;
};

export type TextColumnType = ColumnType<
  string | undefined,
  string | undefined,
  string | null,
  'text'
>;

export type LinkColumnType<T> = ColumnType<
  object,
  number[] | {newIds: number[]; deletedIds: number[]} | undefined,
  number[] | undefined,
  'link'
> & {
  table: T;
};

export type NumberColumnType = ColumnType<
  number | undefined,
  number | undefined,
  number | undefined,
  'number'
>;

export type CheckboxColumnType = ColumnType<
  boolean | undefined,
  boolean | undefined,
  boolean | undefined,
  'checkbox'
>;
