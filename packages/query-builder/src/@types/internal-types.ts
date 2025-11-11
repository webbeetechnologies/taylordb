import {
  MetadataWithTableName,
  ObjConfigurationVisibleField,
  SelectQueryMetaData,
} from '@taylordb/shared';

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

export type AnyDB = {
  filters: Filters;
  aggregates: Aggregates;
  tables: any;
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
