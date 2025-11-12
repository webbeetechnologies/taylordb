import { AggregationQueryBuilder } from './aggregation-query-builder.js';
import { DeleteQueryBuilder } from './delete-query-builder.js';
import { Executor } from './executor.js';
import { InsertQueryBuilder } from './insert-query-builder.js';
import { QueryBuilder } from './query-builder.js';
import { UpdateQueryBuilder } from './update-query-builder.js';

export type AnySubscribableQueryBuilder =
  | QueryBuilder<any, any, any, any>
  | AggregationQueryBuilder<any, any, any, any>;

export type AnyQueryBuilder =
  | AnySubscribableQueryBuilder
  | InsertQueryBuilder<any, any, any>
  | UpdateQueryBuilder<any, any>
  | DeleteQueryBuilder<any, any>;

type InferExecuteResult<TBuilder> = TBuilder extends {
  execute: () => Promise<any>;
}
  ? Awaited<ReturnType<TBuilder['execute']>>
  : never;

export type AreAllBuildersSubscribable<
  TBuilders extends readonly AnyQueryBuilder[],
> = TBuilders[number] extends AnySubscribableQueryBuilder ? true : false;

export class BatchQueryBuilder<
  const TBuilders extends readonly AnyQueryBuilder[],
> {
  #builders: TBuilders;
  #executor: Executor;

  constructor(builders: TBuilders, executor: Executor) {
    this.#builders = builders;
    this.#executor = executor;
  }

  async execute(): Promise<{
    -readonly [K in keyof TBuilders]: InferExecuteResult<TBuilders[K]>;
  }> {
    return this.#executor.execute(this);
  }

  subscribe(
    callback: (
      ...results: {
        -readonly [K in keyof TBuilders]: InferExecuteResult<TBuilders[K]>;
      }
    ) => void,
  ) {
    const builders = this.#builders.filter(
      builder =>
        builder instanceof AggregationQueryBuilder ||
        builder instanceof QueryBuilder,
    );

    if (builders.length !== this.#builders.length) {
      throw new Error(
        'Batch contains non-subscribable queries (e.g., insert, update, delete)',
      );
    }

    return this.#executor.subscribe(builders, callback as any);
  }

  compile(): { query: string; variables: Record<string, any> } {
    const query = 'mutation ($metadata: JSON) { execute(metadata: $metadata) }';

    const metadata = this.#builders.map(builder => {
      return builder._prepareMetadata();
    });

    return {
      query,
      variables: {
        metadata,
      },
    };
  }
}
