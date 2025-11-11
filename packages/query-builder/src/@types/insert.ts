import {
  ColumnType,
  CreateMutationMetaData,
  MetadataWithTableName,
} from '@taylordb/shared';

import { QueryNode } from './internal-types.js';

export type InsertNode = MetadataWithTableName<CreateMutationMetaData> & {
  returning: (string | QueryNode)[];
};

export type Insertable<T> = {
  [K in keyof T]?: T[K] extends ColumnType<any, any, infer I, any> ? I : never;
};
