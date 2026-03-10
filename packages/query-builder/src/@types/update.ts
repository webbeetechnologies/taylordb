import {
  MetadataWithTableName,
  UpdateMutationMetaData,
} from '@taylordb/shared';
import { AnyDB } from './internal-types';
import { ColumnType } from '@taylordb/shared';

export type UpdateNode = MetadataWithTableName<UpdateMutationMetaData>;

type NotUpdatableKeys<T extends AnyDB[string]> = {
  [K in keyof T]: T[K] extends ColumnType<any, any, any, any, any>
    ? T[K]['update'] extends never
      ? K
      : never
    : K;
}[keyof T];

export type Updatable<T extends AnyDB[string]> = {
  [K in keyof Omit<T, NotUpdatableKeys<T>>]?: T[K] extends ColumnType<
    any,
    any,
    any,
    any,
    any
  >
    ? T[K]['update']
    : never;
};
