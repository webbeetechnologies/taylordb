import { ColumnType } from '@taylordb/shared';
import { MetadataWithTableName, SelectQueryMetaData } from '@webbeetechnologies/dbwand-utilities';

export type AnyDB = Record<
  string,
  Record<string, ColumnType<any, any, any, any>>
>;

export type QueryNode = Omit<MetadataWithTableName<SelectQueryMetaData>, 'fields'> & {
  fields?: ( '*' | string | QueryNode)[];
  queryType: 'root' | 'link';
};
