import { FieldWithDirection, GroupingConfiguration } from '@webbeetechnologies/dbwand-utilities/index.js';
import type { AggregateNode, AggregateRecord } from './@types/aggregate.js';
import type { AnyDB } from './@types/internal-types.js';
import { Executor } from './executor.js';
import { FilterableQueryBuilder } from './where-query-builder.js';

export class AggregationQueryBuilder<
  DB extends AnyDB,
  TableName extends keyof DB['tables'],
  FN extends string = never,
> extends FilterableQueryBuilder<DB, TableName> {
  #node: AggregateNode;

  constructor(node: AggregateNode, executor: Executor) {
    super(node, executor);
    this.#node = node;
  }

  groupBy(
    fields: (keyof DB['tables'][TableName] & string)[]
  ): AggregationQueryBuilder<DB, TableName, FN> {
    return new AggregationQueryBuilder(
      {
        ...this.#node,
        groupings: [...(this.#node.groupings || []), ...fields] as GroupingConfiguration<string>[],
      },
      this._executor
    );
  }

  withAggregates<T extends { [K in keyof DB['tables'][TableName] & string]?: (keyof DB['aggregates'][DB['tables'][TableName][K]['type']])[] }>(
    aggregates: T
  ): AggregationQueryBuilder<DB, TableName, FN | (keyof T & string)> {
    const newAggregates = { ...this.#node.aggregations };
    for (const key in aggregates) {
        newAggregates[key] = aggregates[key]!.map(aggregate => aggregate as string);
    }

    return new AggregationQueryBuilder(
      {
        ...this.#node,
        aggregations: newAggregates,
      },
      this._executor
    );
  }

  limit(
    count: number
  ): AggregationQueryBuilder<DB, TableName, FN> {
    return new AggregationQueryBuilder(
      {
        ...this.#node,
        pagination: {...this.#node.pagination, limit: count},
      },
      this._executor
    );
  }

  offset(
    count: number
  ): AggregationQueryBuilder<DB, TableName, FN> {
    return new AggregationQueryBuilder(
      {
        ...this.#node,
        pagination: {...this.#node.pagination, offset: count},
      },
      this._executor
    );
  }

  paginate(
    page: number,
    limit: number
  ): AggregationQueryBuilder<DB, TableName, FN> {
    return this.offset((page - 1) * limit).limit(limit);
  }

  orderBy(
    field: keyof DB['tables'][TableName],
    direction: 'asc' | 'desc' = 'asc'
  ): AggregationQueryBuilder<DB, TableName, FN> {
    const newSorting: FieldWithDirection<string> = {
      field: field as string,
      direction,
    };

    return new AggregationQueryBuilder(
      {
        ...this.#node,
        sorting: [...(this.#node.sorting || []), newSorting],
      },
      this._executor
    );
  }

  async execute(): Promise<AggregateRecord<FN>> {
    const response = await this._executor.execute<AggregateRecord<FN>[]>(this);
    return response[0];
  }

  compile(): {query: string; variables: Record<string, any>} {
    const query = `mutation ($metadata: JSON) { execute(metadata: $metadata) }`;
    const metadata = [this._prepareMetadata()];
    return { query, variables: { metadata } };
  }

  _prepareMetadata(): any {
    return {
      type: 'aggregate',
      tableName: this.#node.tableName,
      groupings: this.#node.groupings,
      aggregations: this.#node.aggregations,
      ...(this.#node.filtersSet.filtersSet.length > 0 ? { filtersSet: this.#node.filtersSet } : {}),
      ...(this.#node.pagination ? { pagination: this.#node.pagination } : {}),
      ...(this.#node.sorting ? { sorting: this.#node.sorting } : {}),
    };
  }
}
