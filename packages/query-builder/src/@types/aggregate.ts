import {
  AggregationQueryMetaData,
  ALinkColumnType,
  MetadataWithTableName,
} from '@taylordb/shared';
import { AnyDB } from './internal-types.js';
import { InferDataType, TableShape } from './type-helpers.js';

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

type InferGroupType<
  DB extends AnyDB,
  TName extends keyof DB,
  K extends keyof DB[TName],
> =
  DB[TName][K] extends ALinkColumnType<
    infer L,
    any,
    any,
    any,
    infer R,
    any,
    any
  >
    ? R extends true
      ? TableShape<DB[L]>
      : TableShape<DB[L]> | null
    : InferDataType<DB[TName][K]>;

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
      slug: Head<TGroupBy>;
      value: InferGroupType<DB, TName, Head<TGroupBy>>;
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

/**
 * Flat metrics response type.
 * This represents a single row in the flattened aggregation results.
 */
export type MetricsRecord<
  DB extends AnyDB,
  TName extends keyof DB,
  TGroupBy extends readonly (keyof DB[TName] & string)[],
  TMetrics extends Record<string, { field: string; aggregation: string }>,
> = {
  [K in TGroupBy[number]]: InferGroupType<DB, TName, K>;
} & {
  [K in keyof TMetrics]: TMetrics[K] extends {
    field: infer F;
    aggregation: infer A;
  }
    ? F extends keyof DB[TName] & string
      ? A extends keyof DB[TName][F]['aggregations']
        ? DB[TName][F]['aggregations'][A]
        : A extends 'count'
          ? number
          : number
      : number
    : number;
};
