import { AggregationQueryMetaData, MetadataWithTableName } from "@webbeetechnologies/dbwand-utilities";


export type AggregationValue = number | null | object | undefined;

export type Aggregates<FN extends string> = {
  [k in FN]?: { [operator: string]: AggregationValue };
};

export type AggregateRecord<FN extends string> = {
  slug?: string;
  value?: unknown;
  count: number;
  children?: AggregateRecord<FN>[];
  aggregates: Aggregates<FN>;
};

export type AggregateNode = Omit<MetadataWithTableName<AggregationQueryMetaData>, 'fields'>


