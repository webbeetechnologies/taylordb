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

/**
 * A query builder for executing multiple queries in a single batch.
 * @template TBuilders - An array of query builders to execute.
 */
export class BatchQueryBuilder<
  const TBuilders extends readonly AnyQueryBuilder[],
> {
  #builders: TBuilders;
  #executor: Executor;

  constructor(builders: TBuilders, executor: Executor) {
    this.#builders = builders;
    this.#executor = executor;
  }

  /**
   * Executes the batch query.
   * @returns A promise that resolves with an array of the results from each query in the batch.
   *
   * @example
   * ```typescript
   * const [users, newUser] = await qb.batch([
   *   qb.selectFrom('users').select(['id', 'name']),
   *   qb.insertInto('users').values({ name: 'New User' }).returning(['id', 'name']),
   * ]).execute();
   * ```
   */
  async execute(): Promise<{
    -readonly [K in keyof TBuilders]: InferExecuteResult<TBuilders[K]>;
  }> {
    return this.#executor.execute(this);
  }

  /**
   * Subscribes to the results of the batch query.
   * This is only possible if all queries in the batch are subscribable (select and aggregate).
   * @param callback - A callback function that will be called with the results of the batch query.
   * @returns A function to unsubscribe from the query.
   *
   * @example
   * ```typescript
   * const unsubscribe = qb.batch([
   *   qb.selectFrom('users').select(['id', 'name']),
   *   qb.aggregateFrom('users').groupBy('role').metrics({ count: count('id') }),
   * ]).subscribe(([users, userAggregates]) => {
   *   console.log('Users:', users);
   *   console.log('User Aggregates:', userAggregates);
   * });
   *
   * // To stop listening for updates
   * unsubscribe();
   * ```
   */
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
