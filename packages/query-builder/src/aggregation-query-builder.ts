import type {
  FieldWithDirection,
  GroupingConfiguration,
} from '@taylordb/shared';
import { isEmpty } from 'lodash';
import type {
  AggregateNode,
  AggregateRecord,
  MetricsRecord,
} from './@types/aggregate.js';
import type { AnyDB } from './@types/internal-types.js';
import type { AggregationHelper } from './aggregation-helpers.js';
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
  TMetrics extends Record<string, AggregationHelper> | undefined = undefined,
> extends FilterableQueryBuilder<DB, TableName> {
  #node: AggregateNode;
  #metrics?: TMetrics;

  constructor(node: AggregateNode, executor: Executor, metrics?: TMetrics) {
    super(node, executor);
    this.#node = node;
    this.#metrics = metrics;
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
   *   .metrics({ count: count('id') })
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
    TAggregations,
    TMetrics
  > {
    const newGrouping: GroupingConfiguration<string> = {
      field,
      direction,
    };

    return new AggregationQueryBuilder<
      DB,
      TableName,
      [...TGroupBy, TField],
      TAggregations,
      TMetrics
    >(
      {
        ...this.#node,
        groupings: [...(this.#node.groupings || []), newGrouping],
      },
      this._executor,
      this.#metrics,
    );
  }

  /**
   * Specifies the metrics to compute using helper functions.
   * Returns a flat array of records with groupBy fields and metrics at the top level.
   * @param metrics - An object where keys are metric names and values are aggregation helper functions.
   * @returns A new `AggregationQueryBuilder` instance with the metrics applied.
   *
   * @example
   * ```typescript
   * const userStats = await qb
   *   .aggregateFrom('users')
   *   .groupBy('role', 'asc')
   *   .groupBy('permission', 'desc')
   *   .metrics({
   *     idCount: count('id'),
   *     ageAvg: avg('age'),
   *     ageSum: sum('age')
   *   })
   *   .execute();
   * ```
   */
  metrics<const T extends Record<string, AggregationHelper>>(
    metrics: T,
  ): AggregationQueryBuilder<DB, TableName, TGroupBy, TAggregations, T> {
    // Convert metrics format to aggregations format for the backend
    const newAggregates: Record<string, string[]> = {
      ...this.#node.aggregations,
    };
    for (const metricName in metrics) {
      const helper = metrics[metricName]!;
      const field = helper.field;
      const aggregation = helper.aggregation;

      if (!newAggregates[field]) {
        newAggregates[field] = [];
      }
      if (!newAggregates[field]!.includes(aggregation)) {
        newAggregates[field]!.push(aggregation);
      }
    }

    return new AggregationQueryBuilder(
      {
        ...this.#node,
        aggregations: newAggregates,
      },
      this._executor,
      metrics as T,
    );
  }

  /**
   * Sets the maximum number of records to return.
   * @param count - The maximum number of records.
   * @returns A new `AggregationQueryBuilder` instance with the limit applied.
   */
  limit(
    count: number,
  ): AggregationQueryBuilder<DB, TableName, TGroupBy, TAggregations, TMetrics> {
    return new AggregationQueryBuilder(
      {
        ...this.#node,
        pagination: { ...this.#node.pagination, limit: count },
      },
      this._executor,
      this.#metrics,
    );
  }

  /**
   * Sets the number of records to skip.
   * @param count - The number of records to skip.
   * @returns A new `AggregationQueryBuilder` instance with the offset applied.
   */
  offset(
    count: number,
  ): AggregationQueryBuilder<DB, TableName, TGroupBy, TAggregations, TMetrics> {
    return new AggregationQueryBuilder(
      {
        ...this.#node,
        pagination: { ...this.#node.pagination, offset: count },
      },
      this._executor,
      this.#metrics,
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
  ): AggregationQueryBuilder<DB, TableName, TGroupBy, TAggregations, TMetrics> {
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
  ): AggregationQueryBuilder<DB, TableName, TGroupBy, TAggregations, TMetrics> {
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
      this.#metrics,
    );
  }

  /**
   * Executes the aggregation query.
   * @returns A promise that resolves with an array of the aggregation results.
   * If metrics were specified, returns a flat array. Otherwise, returns the nested structure.
   *
   * @example
   * ```typescript
   * const userCounts = await qb
   *   .aggregateFrom('users')
   *   .groupBy('role')
   *   .metrics({ count: count('id') })
   *   .execute();
   * ```
   */
  async execute(): Promise<
    TMetrics extends Record<string, AggregationHelper>
      ? MetricsRecord<DB, TableName, TGroupBy, TMetrics>[]
      : AggregateRecord<DB, TableName, TGroupBy, TAggregations>[]
  > {
    const response =
      await this._executor.execute<
        AggregateRecord<DB, TableName, TGroupBy, TAggregations>[][]
      >(this);

    // If metrics are used, flatten the nested structure
    if (this.#metrics) {
      return this._flattenMetrics(
        response[0],
        this.#node.groupings
          ?.filter(
            (g): g is { field: string; direction: string } =>
              'field' in g && !('formula' in g),
          )
          .map(g => g.field) || [],
        this.#metrics,
      ) as any;
    }

    return response as any;
  }

  /**
   * Flattens the nested AggregateRecord structure into a flat array of metrics records.
   */
  private _flattenMetrics<TMetrics extends Record<string, AggregationHelper>>(
    records: AggregateRecord<DB, TableName, TGroupBy, TAggregations>[],
    groupByFields: string[],
    metrics: TMetrics,
  ): MetricsRecord<DB, TableName, TGroupBy, TMetrics>[] {
    const result: MetricsRecord<DB, TableName, TGroupBy, TMetrics>[] = [];

    const flatten = (
      record: AggregateRecord<DB, TableName, TGroupBy, TAggregations>,
      path: Record<string, any>,
    ) => {
      if ('slug' in record && 'value' in record) {
        const currentPath = {
          ...path,
          [record.slug]: record.value,
        };

        if (
          'children' in record &&
          Array.isArray(record.children) &&
          !isEmpty(record.children)
        ) {
          // Has children, recurse
          for (const child of record.children) {
            flatten(child, currentPath);
          }
        } else {
          // Leaf node, create flat record
          const flatRecord: any = { ...currentPath };

          // Add metrics
          for (const metricName in metrics) {
            const helper = metrics[metricName]!;
            const field = helper.field;
            const aggregation = helper.aggregation;

            // Extract the metric value from aggregates
            if (
              record.aggregates &&
              field in record.aggregates &&
              record.aggregates[field] &&
              typeof record.aggregates[field] === 'object' &&
              aggregation in (record.aggregates[field] as any)
            ) {
              flatRecord[metricName] = (record.aggregates[field] as any)[
                aggregation
              ];
            } else {
              flatRecord[metricName] = null;
            }
          }

          result.push(flatRecord);
        }
      } else {
        // No groupBy, just metrics
        const flatRecord: any = {};

        // Add metrics
        for (const metricName in metrics) {
          const helper = metrics[metricName]!;
          const field = helper.field;
          const aggregation = helper.aggregation;

          if (
            record.aggregates &&
            field in record.aggregates &&
            record.aggregates[field] &&
            typeof record.aggregates[field] === 'object' &&
            aggregation in (record.aggregates[field] as any)
          ) {
            flatRecord[metricName] = (record.aggregates[field] as any)[
              aggregation
            ];
          } else {
            flatRecord[metricName] = null;
          }
        }

        result.push(flatRecord);
      }
    };

    for (const record of records) {
      flatten(record, {});
    }

    return result;
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
   *   .metrics({ count: count('id') })
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
      result: TMetrics extends Record<string, AggregationHelper>
        ? MetricsRecord<DB, TableName, TGroupBy, TMetrics>[]
        : AggregateRecord<DB, TableName, TGroupBy, TAggregations>[],
    ) => void,
  ) {
    return this._executor.subscribe([this], (rawResult: any) => {
      if (this.#metrics) {
        const flattened = this._flattenMetrics(
          rawResult,
          this.#node.groupings
            ?.filter(
              (g): g is { field: string; direction: string } =>
                'field' in g && !('formula' in g),
            )
            .map(g => g.field) || [],
          this.#metrics,
        );
        callback(flattened as any);
      } else {
        callback(rawResult);
      }
    });
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
