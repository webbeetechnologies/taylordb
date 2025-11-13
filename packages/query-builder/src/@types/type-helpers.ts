import { ColumnType, LinkColumnType } from '@taylordb/shared';
import { QueryBuilder } from '../query-builder.js';
import { AnyDB } from './internal-types.js';
import { LinkColumnNames, NonLinkColumnNames } from './query-builder.js';

export type InferDataType<TColumn> =
  TColumn extends ColumnType<any, any, any, infer D> ? D : never;

export type TableShape<TTable> = {
  [K in keyof TTable]: InferDataType<TTable[K]>;
};

type InferSubqueryResult<TSubquery> =
  TSubquery extends QueryBuilder<any, any, infer TSelection, any>
    ? TSelection[]
    : never;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

type InferSubqueryShape<TFunc> = TFunc extends (
  b: any,
) => QueryBuilder<any, any, infer SubSelection, infer LinkName>
  ? { [K in LinkName & string]: SubSelection[] }
  : object;

export type ResolveSelection<
  DB extends AnyDB,
  TName extends keyof DB,
  TFields extends readonly any[],
  TCurrentSelection,
> = TCurrentSelection &
  UnionToIntersection<
    {
      [I in keyof TFields]: TFields[I] extends NonLinkColumnNames<DB[TName]>
        ? { [K in TFields[I]]: InferDataType<DB[TName][K]> }
        : TFields[I] extends (b: any) => QueryBuilder<any, any, any, any>
          ? InferSubqueryShape<TFields[I]>
          : object;
    }[number]
  >;

export type ResolveWithPlain<
  DB extends AnyDB,
  TName extends keyof DB,
  TRelations extends
    | (LinkColumnNames<DB[TName]> & string)
    | readonly (LinkColumnNames<DB[TName]> & string)[],
  TCurrentSelection,
> = TCurrentSelection &
  UnionToIntersection<
    {
      [K in TRelations extends readonly any[]
        ? TRelations[number]
        : TRelations]: {
        [P in K]: TableShape<
          DB[DB[TName][P] extends LinkColumnType<infer L> ? L : never]
        >[];
      };
    }[TRelations extends readonly any[] ? TRelations[number] : TRelations]
  >;

export type ResolveWithObject<
  TRelations extends Record<
    string,
    (qb: any) => QueryBuilder<any, any, any, any>
  >,
  TCurrentSelection,
> = TCurrentSelection & {
  -readonly [K in keyof TRelations]: InferSubqueryResult<
    ReturnType<TRelations[K]>
  >;
};
