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

export type ColumnType<
  S,
  U,
  I,
  T,
  F extends { [key: string]: any } = object,
  A extends { [key: string]: any } = object,
> = {
  raw: S;
  insert: I;
  update: U;
  type: T;
  filters: F;
  aggregations: A;
};

export type DateColumnType = ColumnType<
  string | undefined,
  string | undefined,
  string | undefined,
  'date',
  {
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
  },
  {
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
  }
>;

export type TextColumnType = ColumnType<
  string | undefined,
  string | undefined,
  string | null,
  'text',
  {
    '=': string;
    '!=': string;
    caseEqual: string;
    hasAnyOf: string[];
    contains: string;
    startsWith: string;
    endsWith: string;
    doesNotContain: string;
  }
>;

export type LinkColumnType<T extends string> = ColumnType<
  object,
  number[] | { newIds: number[]; deletedIds: number[] } | undefined,
  number[] | undefined,
  'link',
  {
    hasAnyOf: number[];
    hasAllOf: number[];
    isExactly: number[];
    '=': number;
    hasNoneOf: number[];
  },
  {
    empty: number;
    filled: number;
    percentEmpty: number;
    percentFilled: number;
  }
> & {
  linkedTo: T;
};

export type NumberColumnType = ColumnType<
  number | undefined,
  number | undefined,
  number | undefined,
  'number',
  {
    '=': number;
    '!=': number;
    '>': number;
    '>=': number;
    '<': number;
    '<=': number;
    hasAnyOf: number[];
    hasNoneOf: number[];
  },
  {
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
  }
>;

export type CheckboxColumnType = ColumnType<
  boolean | undefined,
  boolean | undefined,
  boolean | undefined,
  'checkbox',
  {
    '=': number;
  }
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

export type TaylorDatabase = {
  /**
   *
   *
   * Internal tables, these tables can not be queried directly.
   *
   */
  selectTable: SelectTable;
  attachmentTable: AttachmentTable;
  collaboratorsTable: CollaboratorsTable;
  users: UsersTable;
  chat: ChatTable;
  messages: MessagesTable;
};

type UsersTable = {
  id: NumberColumnType;
  createdAt: DateColumnType;
  updatedAt: DateColumnType;
  name: TextColumnType;
  messages: LinkColumnType<'messages'>;
  messages1: LinkColumnType<'messages'>;
};

type ChatTable = {
  id: NumberColumnType;
  createdAt: DateColumnType;
  updatedAt: DateColumnType;
  name: TextColumnType;
};

type MessagesTable = {
  id: NumberColumnType;
  createdAt: DateColumnType;
  updatedAt: DateColumnType;
  content: TextColumnType;
  user: LinkColumnType<'users'>;
  chat: LinkColumnType<'users'>;
};
