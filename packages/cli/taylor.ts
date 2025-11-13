/**
 * Copyright (c) 2025 TaylorDB
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

type IsWithinOperatorValue =
  | 'pastWeek'
  | 'pastMonth'
  | 'pastYear'
  | 'nextWeek'
  | 'nextMonth'
  | 'nextYear'
  | 'daysFromNow'
  | 'daysAgo'
  | 'currentWeek'
  | 'currentMonth'
  | 'currentYear';

type DefaultDateFilterValue =
  | (
      | 'today'
      | 'tomorrow'
      | 'yesterday'
      | 'oneWeekAgo'
      | 'oneWeekFromNow'
      | 'oneMonthAgo'
      | 'oneMonthFromNow'
    )
  | ['exactDay' | 'exactTimestamp', string]
  | ['daysAgo' | 'daysFromNow', number];

export type Filters = {
  text: {
    '=': string;
    '!=': string;
    caseEqual: string;
    hasAnyOf: string[];
    contains: string;
    startsWith: string;
    endsWith: string;
    doesNotContain: string;
  };
  number: {
    '=': number;
    '!=': number;
    '>': number;
    '>=': number;
    '<': number;
    '<=': number;
    hasAnyOf: number[];
    hasNoneOf: number[];
  };
  checkbox: {
    '=': number;
  };
  link: {
    hasAnyOf: number[];
    hasAllOf: number[];
    isExactly: number[];
    '=': number;
    hasNoneOf: number[];
  };
  date: {
    '=': DefaultDateFilterValue;
    '!=': DefaultDateFilterValue;
    '<': DefaultDateFilterValue;
    '>': DefaultDateFilterValue;
    '<=': DefaultDateFilterValue;
    '>=': DefaultDateFilterValue;
    isWithIn:
      | IsWithinOperatorValue
      | { value: 'daysAgo' | 'daysFromNow'; date: number };
    isEmpty: boolean;
    isNotEmpty: boolean;
  };
};

type Aggregates = {
  number: {
    sum: number;
    average: number;
    median: number;
    min: number | null;
    max: number | null;
    range: number;
    standardDeviation: number;
    histogram: Record<string, number>;
    empty: number;
    filled: number;
    unique: number;
    percentEmpty: number;
    percentFilled: number;
    percentUnique: number;
  };
  date: {
    empty: number;
    filled: number;
    unique: number;
    percentEmpty: number;
    percentFilled: number;
    percentUnique: number;
    min: number | null;
    max: number | null;
    daysRange: number | null;
    monthRange: number | null;
  };
  link: {
    empty: number;
    filled: number;
    percentEmpty: number;
    percentFilled: number;
  };
};

export type ColumnType<S, U, I, T> = {
  raw: S;
  insert: I;
  update: U;
  type: T;
};

export type DateColumnType = ColumnType<
  string | undefined,
  string | undefined,
  string | undefined,
  'date'
>;

export type TextColumnType = ColumnType<
  string | undefined,
  string | undefined,
  string | null,
  'text'
>;

export type LinkColumnType<T extends string> = ColumnType<
  object,
  number[] | { newIds: number[]; deletedIds: number[] } | undefined,
  number[] | undefined,
  'link'
> & {
  linkedTo: T;
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

export type SelectTable = {
  id: NumberColumnType;
  name: TextColumnType;
  color: TextColumnType;
};

export type AttachmentTable = {
  id: NumberColumnType;
  name: TextColumnType;
  metadata: TextColumnType;
  size: NumberColumnType;
  fileType: TextColumnType;
  url: TextColumnType;
};

export type CollaboratorsTable = {
  id: NumberColumnType;
  name: TextColumnType;
  emailAddress: TextColumnType;
  avatar: TextColumnType;
};

export interface Tables {
  /**
   *
   *
   * Internal tables, these tables can not be queried directly.
   *
   */
  selectTable: SelectTable;
  attachmentTable: AttachmentTable;
  collaboratorsTable: CollaboratorsTable;
  customers: CustomersTable;
  orders: OrdersTable;
  products: ProductsTable;
}

export interface TaylorDatabase {
  filters: Filters;

  aggregates: Aggregates;

  tables: Tables;
}

interface CustomersTable {
  id: NumberColumnType;
  createdAt: DateColumnType;
  updatedAt: DateColumnType;
  firstName: TextColumnType;
  phoneNumber: TextColumnType;
  lastName: TextColumnType;
  avatar: LinkColumnType<'attachmentTable'>;
  orders: LinkColumnType<'orders'>;
}

interface OrdersTable {
  id: NumberColumnType;
  createdAt: DateColumnType;
  updatedAt: DateColumnType;
  address: TextColumnType;
  customer: LinkColumnType<'customers'>;
  products: LinkColumnType<'products'>;
}

interface ProductsTable {
  id: NumberColumnType;
  createdAt: DateColumnType;
  updatedAt: DateColumnType;
  name: TextColumnType;
  sku: TextColumnType;
  orders1: LinkColumnType<'orders'>;
}
