import {
  CreateMutationMetaData,
  MetadataWithTableName,
} from '@taylordb/shared';

import { AnyDB, QueryNode } from './internal-types.js';
import { ColumnType } from '@taylordb/shared';

export type InsertNode = MetadataWithTableName<CreateMutationMetaData> & {
  returning: (string | QueryNode)[];
};

type RequiredKeys<T extends AnyDB[string]> = {
  [K in keyof T]: T[K] extends ColumnType<any, any, any, any, any>
    ? T[K]['isRequired'] extends true
      ? T[K]['insert'] extends never
        ? never
        : K
      : never
    : never;
}[keyof T];

type OptionalKeys<T extends AnyDB[string]> = {
  [K in keyof T]: T[K] extends ColumnType<any, any, any, any, any>
    ? T[K]['isRequired'] extends false
      ? T[K]['insert'] extends never
        ? never
        : K
      : never
    : never;
}[keyof T];

export type Insertable<T extends AnyDB[string]> = {
  [K in RequiredKeys<T>]: T[K] extends ColumnType<any, any, any, any, any>
    ? T[K]['insert']
    : never;
} & {
  [K in OptionalKeys<T>]?: T[K] extends ColumnType<any, any, any, any, any>
    ? T[K]['insert']
    : never;
};
