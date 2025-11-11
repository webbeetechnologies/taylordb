import {
    AggregateConfiguration,
    Configuration,
    FiltersSet,
    PaginationRequest,
} from './table-loader';

export type SelectQueryMetaData = {
  type: 'select';
} & Configuration<string>;

export type PaginationQueryMetaData = {
  type: 'pagination';
  filtersSet?: FiltersSet<string>;
  pagination?: PaginationRequest;
};

export type AggregationQueryMetaData = {
  type: 'aggregation';
} & AggregateConfiguration<string>;

export type UpdateMutationMetaData = {
  type: 'update';
  values: any;
  filtersSet?: FiltersSet<string>;
};
export type DeleteMutationMetaData = {
  type: 'delete';
  filtersSet?: FiltersSet<string>;
  deletedRecordIds: number[];
};
export type CreateMutationMetaData = {
  type: 'create';
  createdRecords: any[];
};

export type AvailableMetaData =
  | UpdateMutationMetaData
  | DeleteMutationMetaData
  | CreateMutationMetaData
  | SelectQueryMetaData
  | PaginationQueryMetaData
  | AggregationQueryMetaData;

export type QueryMetadata =
  | SelectQueryMetaData
  | PaginationQueryMetaData
  | AggregationQueryMetaData;

export type MutationMetaData =
  | UpdateMutationMetaData
  | DeleteMutationMetaData
  | CreateMutationMetaData;

export type MetadataWithTableName<T extends AvailableMetaData> = T & {
  tableName: string;
};
