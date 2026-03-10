import {
  ALinkColumnType,
  Filters,
  MetadataWithTableName,
  ObjConfigurationVisibleField,
  SelectQueryMetaData,
} from '@taylordb/shared';

export type AnyDB = {
  [K in keyof any]:
    | {
        [K in keyof any]: any;
      }
    | any;
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

export type PluginActionNode = {
  type: 'plugin-action';
  plugin: string;
  action: string;
  input: Record<string, any>;
};

export type QueryNode = SelectionQueryNode | RootQueryNode;

export type FilterableNode = Pick<QueryNode, 'filtersSet'>;

export type Filter = Filters<string>;

export type AbstractLinkColumn = ALinkColumnType<
  any,
  any,
  any,
  any,
  boolean,
  any,
  any
>;
