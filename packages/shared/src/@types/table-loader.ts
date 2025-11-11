export type FieldWithDirection<FN> = {
  field: FN;
  direction: string;
  values?: unknown;
};

export type FiltersSet<FN> = {
  conjunction: 'and' | 'or';
  filtersSet: (FiltersSet<FN> | Filters<FN>)[];
};

export type Filters<FN> = { field: FN; operator: string; value?: unknown };

export type FieldsOrder<FN> = {
  field: FN;
  isVisible: boolean;
};

export type FieldsConfiguration<FN extends string> = {
  [key in FN]: string[] | null;
};

export type FieldsWithPaginationConfiguration = {
  field: string;
  pagination?: PaginationRequest;
  fields: string[];
};

export type FieldsConfigurations = {
  field: string;
  pagination?: PaginationRequest;
  fields: FieldsConfigurations[];
  isVisible: boolean;
  isQueryable: boolean;
  isFilterable: boolean;
  hasPagination: boolean;
};

export type ObjConfigurationVisibleField<FN extends string> =
  Configuration<string> & { field: FN };

export type ConfigurationVisibleField<FN extends string> =
  | '*'
  | FN
  | `${FN}:${string}`
  | ObjConfigurationVisibleField<FN>;

export type Configuration<FN extends string> = {
  filtersSet?: FiltersSet<FN>;

  /**
   *
   * This property is deprecated please use filtersSet instead
   *
   * @deprecated
   */
  filters?: Filters<FN>[];
  sorting?: FieldWithDirection<FN>[];
  pagination?: PaginationRequest | LimitOffset;
  fields?: ConfigurationVisibleField<FN>[];
};

export type LimitOffset = { limit: number; offset: number };

export type PaginationRequest = {
  perPage: number;
  page: number;
};

export type PaginationResponse =
  | { total: number }
  | {
      page: number;
      perPage: number;
      total: number;
      pages: number;
    };

export type InsertionReturnValue<DB extends object, TB extends keyof DB> = {
  [key in keyof DB[TB]]: any;
};

export type AggregationFields<FN extends string> = {
  [field in FN]: string[];
};

export type FieldBasedGrouping<FN extends string> = FieldWithDirection<FN>;

export type FormulaBasedGrouping<FN extends string> = {
  formula: string;
} & Pick<FieldWithDirection<FN>, 'direction'>;

export type GroupingConfiguration<FN extends string> =
  | FieldBasedGrouping<FN>
  | FormulaBasedGrouping<FN>;

export type AggregateConfiguration<FN extends string> = Exclude<
  Configuration<FN>,
  'fields' | 'sorting'
> & {
  groupings?: GroupingConfiguration<FN>[];
  aggregations?: AggregationFields<FN>;
};

export type Aggregates<FN extends string> = {
  [k in FN]?: { [operator: string]: AggregationValue };
};

export type AggregationValue = number | null | object | undefined;

export type AggregateRecord<FN extends string> = {
  slug?: string;
  value?: unknown;
  count: number;
  children?: AggregateRecord<FN>[];
  aggregates: Aggregates<FN>;
};

export type FieldAggregation = { [name: string]: () => AggregationValue };
