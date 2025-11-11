import {
  AggregationQueryMetaData,
  MetadataWithTableName,
} from '@webbeetechnologies/dbwand-utilities';
import { AnyDB } from './internal-types.js';
import { InferDataType } from './type-helpers.js';

export type AggregationValue = number | null | object | undefined;

export type Aggregates<
  DB extends AnyDB,
  TName extends keyof DB['tables'],
  TAggregations extends {
    [K in keyof DB['tables'][TName] &
      string]?: readonly (keyof DB['aggregates'][DB['tables'][TName][K]['type']])[];
  },
> = {
  -readonly [K in keyof TAggregations]: {
    -readonly [P in TAggregations[K][number]]: DB['aggregates'][DB['tables'][TName][K]['type']][P];
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
  TName extends keyof DB['tables'],
  TGroupBy extends readonly (keyof DB['tables'][TName] & string)[],
  TAggregations extends {
    [K in keyof DB['tables'][TName] &
      string]?: readonly (keyof DB['aggregates'][DB['tables'][TName][K]['type']])[];
  },
> = TGroupBy extends readonly []
  ? {
      count: number;
      aggregates: Aggregates<DB, TName, TAggregations>;
    }
  : {
      field: Head<TGroupBy>;
      value: InferDataType<DB['tables'][TName][Head<TGroupBy>]>;
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
