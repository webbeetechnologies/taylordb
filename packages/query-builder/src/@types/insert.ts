import { ColumnType } from '@taylordb/shared';
import { CreateMutationMetaData, MetadataWithTableName } from '@webbeetechnologies/dbwand-utilities';
import { QueryNode } from './internal-types.js';

export type InsertNode = MetadataWithTableName<CreateMutationMetaData> & {returning: (string | QueryNode)[];};

export type Insertable<T> = {
  [K in keyof T]?: T[K] extends ColumnType<any, any, infer I, any>
    ? I
    : never;
};
