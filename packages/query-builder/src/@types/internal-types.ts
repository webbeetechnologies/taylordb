import { ColumnType } from '@taylordb/shared';
import { MetadataWithTableName, ObjConfigurationVisibleField, SelectQueryMetaData } from '@webbeetechnologies/dbwand-utilities';

export type Filters = {
  [key: string]: {
      [key: string]: any;
  };
};

export type Aggregates = {
  [key: string]: {
      [key: string]: any;
  };
};

export type AnyDB = { filters: Filters, aggregates: Aggregates, tables: Record<
  string,
  Record<string, ColumnType<any, any, any, any>>
> };

export type SelectionQueryNode = (ObjConfigurationVisibleField<string> & {queryType: 'link'})

export type RootQueryNode = Omit<MetadataWithTableName<SelectQueryMetaData>, 'fields'> & {
  fields?: ( '*' | string | SelectionQueryNode)[];
  queryType: 'root';
}

export type QueryNode = SelectionQueryNode | RootQueryNode
