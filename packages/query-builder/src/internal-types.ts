import {ColumnType} from '@taylordb/shared';

export type AnyDB = Record<
  string,
  Record<string, ColumnType<any, any, any, any>>
>;

export type WhereClause = {
  field: string;
  operator: string;
  value: any;
};

export type FilterGroup = {
  conjunction: 'and' | 'or';
  filters: (WhereClause | FilterGroup)[];
};

export type QueryNode = {
  from: string;
  selects: (string | QueryNode)[];
  filters: FilterGroup;
  pagination?: {limit?: number; offset?: number};
  queryType: 'root' | 'link';
};
