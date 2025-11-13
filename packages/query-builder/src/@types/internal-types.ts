import {
  ColumnType,
  MetadataWithTableName,
  ObjConfigurationVisibleField,
  SelectQueryMetaData,
} from '@taylordb/shared';

export type AnyDB = {
  [key: string]: {
    [key: string]: ColumnType<any, any, any, any, any, any>;
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
