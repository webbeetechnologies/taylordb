import {
  ColumnType,
  FilterOperator,
  Filters,
  MetadataWithTableName,
  ObjConfigurationVisibleField,
  SelectQueryMetaData,
} from '@taylordb/shared';

export type AnyDB = {
  [key in keyof any]: {
    [key in keyof any]: ColumnType<any, any, any, any, any, any>;
  };
};

export type SelectionQueryNode = ObjConfigurationVisibleField<string> & {
  queryType: 'link';
};

export type RootQueryNode = Omit<
  MetadataWithTableName<SelectQueryMetaData>,
  'fields'
> & {
  fields?: ('*' | string | SelectionQueryNode)[];
  queryType: 'root';
};

export type QueryNode = SelectionQueryNode | RootQueryNode;

export type FilterableNode = Pick<QueryNode, 'filtersSet'>;

export type Filter = Filters<string>;
export type { FilterOperator };
