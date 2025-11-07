import { ColumnType } from '@taylordb/shared';
import { MetadataWithTableName, UpdateMutationMetaData } from '@webbeetechnologies/dbwand-utilities';

export type UpdateNode = MetadataWithTableName<UpdateMutationMetaData>;

export type Updatable<T> = {
  [K in keyof T]?: T[K] extends ColumnType<any, any, infer I, any>
    ? I
    : never;
};
