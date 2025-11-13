import {
  AggregationQueryMetaData,
  MetadataWithTableName,
} from '@taylordb/shared';
import { AnyDB } from './internal-types.js';
import { InferDataType } from './type-helpers.js';

export type AggregationValue = number | null | object | undefined;

export type Aggregates<
  DB extends AnyDB,
  TName extends keyof DB,
  TAggregations extends {
    [K in keyof DB[TName] &
      string]?: readonly (keyof DB[TName][K]['aggregations'])[];
  },
> = {
  -readonly [K in keyof TAggregations & keyof DB[TName]]: {
    -readonly [P in NonNullable<
      TAggregations[K]
    >[number]]: DB[TName][K]['aggregations'][P];
  };
};

type Head<T extends readonly any[]> = T extends readonly [infer H, ...any[]]
  ? H
  : never;
type Tail<T extends readonly any[]> = T extends readonly [any, ...infer R]
  ? R
  : never;

export type AggregateRecord<
  DB extends AnyDB,
  TName extends keyof DB,
  TGroupBy extends readonly (keyof DB[TName] & string)[],
  TAggregations extends {
    [K in keyof DB[TName] &
      string]?: readonly (keyof DB[TName][K]['aggregations'])[];
  },
> = TGroupBy extends readonly []
  ? {
      count: number;
      aggregates: Aggregates<DB, TName, TAggregations>;
    }
  : {
      field: Head<TGroupBy>;
      value: InferDataType<DB[TName][Head<TGroupBy>]>;
      count: number;
      aggregates: Aggregates<DB, TName, TAggregations>;
    } & (Tail<TGroupBy> extends readonly []
      ? object
      : {
          children: AggregateRecord<DB, TName, Tail<TGroupBy>, TAggregations>[];
        });

export type AggregateNode = Omit<
  MetadataWithTableName<AggregationQueryMetaData>,
  'fields'
>;
