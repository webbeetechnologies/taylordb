import type {
  FieldWithDirection,
  GroupingConfiguration,
} from '@taylordb/shared';
import type { AggregateNode, AggregateRecord } from './@types/aggregate.js';
import type { AnyDB } from './@types/internal-types.js';
import { Executor } from './executor.js';
import { FilterableQueryBuilder } from './where-query-builder.js';

/**
 * A query builder for performing aggregation queries.
 * @template DB - The database type.
 * @template TableName - The name of the table to aggregate from.
 * @template TGroupBy - The fields to group by.
 * @template TAggregations - The aggregations to perform.
 */
export class AggregationQueryBuilder<
  DB extends AnyDB,
  TableName extends keyof DB,
  TGroupBy extends readonly (keyof DB[TableName] & string)[] = [],
  TAggregations extends {
    [K in keyof DB[TableName] &
      string]?: readonly (keyof DB[TableName][K]['aggregations'])[];
  } = object,
> extends FilterableQueryBuilder<DB, TableName> {
  #node: AggregateNode;

  constructor(node: AggregateNode, executor: Executor) {
    super(node, executor);
    this.#node = node;
  }

  /**
   * Groups the results by a specified field.
   * @param field - The field to group by.
   * @param direction - The sort direction for the grouping.
   * @returns A new `AggregationQueryBuilder` instance with the grouping applied.
   *
   * @example
   * ```typescript
   * const userCounts = await qb
   *   .aggregateFrom('users')
   *   .groupBy('role')
   *   .withAggregates({ id: ['count'] })
   *   .execute();
   * ```
   */
  groupBy<const TField extends keyof DB[TableName] & string>(
    field: TField,
    direction: 'asc' | 'desc' = 'asc',
  ): AggregationQueryBuilder<
    DB,
    TableName,
    [...TGroupBy, TField],
    TAggregations
  > {
    const newGrouping: GroupingConfiguration<string> = {
      field,
      direction,
    };

    return new AggregationQueryBuilder(
      {
        ...this.#node,
        groupings: [...(this.#node.groupings || []), newGrouping],
      },
      this._executor,
    );
  }

  /**
   * Specifies the aggregations to perform.
   * @param aggregates - An object where the keys are field names and the values are arrays of aggregation functions.
   * @returns A new `AggregationQueryBuilder` instance with the aggregations applied.
   *
   * @example
   * ```typescript
   * const userStats = await qb
   *   .aggregateFrom('users')
   *   .withAggregates({
   *     id: ['count'],
   *     age: ['avg', 'sum'],
   *   })
   *   .execute();
   * ```
   */
  withAggregates<
    const T extends {
      [K in keyof DB[TableName] &
        string]?: readonly (keyof DB[TableName][K]['aggregations'])[];
    },
  >(
    aggregates: T,
  ): AggregationQueryBuilder<DB, TableName, TGroupBy, TAggregations & T> {
    const newAggregates = { ...this.#node.aggregations };
    for (const key in aggregates) {
      newAggregates[key] = aggregates[key]!.map(
        aggregate => aggregate as string,
      );
    }

    return new AggregationQueryBuilder(
      {
        ...this.#node,
        aggregations: newAggregates,
      },
      this._executor,
    );
  }

  /**
   * Sets the maximum number of records to return.
   * @param count - The maximum number of records.
   * @returns A new `AggregationQueryBuilder` instance with the limit applied.
   */
  limit(
    count: number,
  ): AggregationQueryBuilder<DB, TableName, TGroupBy, TAggregations> {
    return new AggregationQueryBuilder(
      {
        ...this.#node,
        pagination: { ...this.#node.pagination, limit: count },
      },
      this._executor,
    );
  }

  /**
   * Sets the number of records to skip.
   * @param count - The number of records to skip.
   * @returns A new `AggregationQueryBuilder` instance with the offset applied.
   */
  offset(
    count: number,
  ): AggregationQueryBuilder<DB, TableName, TGroupBy, TAggregations> {
    return new AggregationQueryBuilder(
      {
        ...this.#node,
        pagination: { ...this.#node.pagination, offset: count },
      },
      this._executor,
    );
  }

  /**
   * Paginates the results.
   * @param page - The page number to retrieve.
   * @param limit - The number of records per page.
   * @returns A new `AggregationQueryBuilder` instance with pagination applied.
   */
  paginate(
    page: number,
    limit: number,
  ): AggregationQueryBuilder<DB, TableName, TGroupBy, TAggregations> {
    return this.offset((page - 1) * limit).limit(limit);
  }

  /**
   * Sorts the results by a specified field.
   * @param field - The field to sort by.
   * @param direction - The sort direction ('asc' or 'desc').
   * @returns A new `AggregationQueryBuilder` instance with the sorting applied.
   */
  orderBy(
    field: keyof DB[TableName],
    direction: 'asc' | 'desc' = 'asc',
  ): AggregationQueryBuilder<DB, TableName, TGroupBy, TAggregations> {
    const newSorting: FieldWithDirection<string> = {
      field: field as string,
      direction,
    };

    return new AggregationQueryBuilder(
      {
        ...this.#node,
        sorting: [...(this.#node.sorting || []), newSorting],
      },
      this._executor,
    );
  }

  /**
   * Executes the aggregation query.
   * @returns A promise that resolves with an array of the aggregation results.
   *
   * @example
   * ```typescript
   * const userCounts = await qb
   *   .aggregateFrom('users')
   *   .groupBy('role')
   *   .withAggregates({ id: ['count'] })
   *   .execute();
   * ```
   */
  async execute(): Promise<
    AggregateRecord<DB, TableName, TGroupBy, TAggregations>[]
  > {
    const response =
      await this._executor.execute<
        AggregateRecord<DB, TableName, TGroupBy, TAggregations>[]
      >(this);
    return response;
  }

  /**
   * Subscribes to the results of the aggregation query.
   * @param callback - A callback function that will be called with the results of the aggregation query.
   * @returns A function to unsubscribe from the query.
   *
   * @example
   * ```typescript
   * const unsubscribe = qb
   *   .aggregateFrom('users')
   *   .groupBy('role')
   *   .withAggregates({ id: ['count'] })
   *   .subscribe((userCounts) => {
   *     console.log('User counts by role:', userCounts);
   *   });
   *
   * // To stop listening for updates
   * unsubscribe();
   * ```
   */
  subscribe(
    callback: (
      result: AggregateRecord<DB, TableName, TGroupBy, TAggregations>[],
    ) => void,
  ) {
    return this._executor.subscribe([this], callback);
  }

  compile(): { query: string; variables: Record<string, any> } {
    const query = 'mutation ($metadata: JSON) { execute(metadata: $metadata) }';
    const metadata = [this._prepareMetadata()];
    return { query, variables: { metadata } };
  }

  _prepareMetadata(): any {
    return {
      type: 'aggregation',
      tableName: this.#node.tableName,
      groupings: this.#node.groupings,
      aggregations: this.#node.aggregations,
      ...(this.#node.filtersSet.filtersSet.length > 0
        ? { filtersSet: this.#node.filtersSet }
        : {}),
      ...(this.#node.pagination ? { pagination: this.#node.pagination } : {}),
      ...(this.#node.sorting ? { sorting: this.#node.sorting } : {}),
    };
  }
}
