import { ColumnType } from '@taylordb/shared';
import { MetadataWithTableName, ObjConfigurationVisibleField, SelectQueryMetaData } from '@webbeetechnologies/dbwand-utilities';

export type AnyDB = Record<
  string,
  Record<string, ColumnType<any, any, any, any>>
>;

export type SelectionQueryNode = (ObjConfigurationVisibleField<string> & {queryType: 'link'})

export type RootQueryNode = Omit<MetadataWithTableName<SelectQueryMetaData>, 'fields'> & {
  fields?: ( '*' | string | SelectionQueryNode)[];
  queryType: 'root';
}

export type QueryNode = SelectionQueryNode | RootQueryNode
