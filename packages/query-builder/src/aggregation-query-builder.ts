import {
  FieldWithDirection,
  GroupingConfiguration,
} from '@webbeetechnologies/dbwand-utilities/index.js';
import type { AggregateNode, AggregateRecord } from './@types/aggregate.js';
import type { AnyDB } from './@types/internal-types.js';
import { Executor } from './executor.js';
import { FilterableQueryBuilder } from './where-query-builder.js';

export class AggregationQueryBuilder<
  DB extends AnyDB,
  TableName extends keyof DB['tables'],
  TGroupBy extends readonly (keyof DB['tables'][TableName] & string)[] = [],
  TAggregations extends {
    [K in keyof DB['tables'][TableName] &
      string]?: readonly (keyof DB['aggregates'][DB['tables'][TableName][K]['type']])[];
  } = {},
> extends FilterableQueryBuilder<DB, TableName> {
  #node: AggregateNode;

  constructor(node: AggregateNode, executor: Executor) {
    super(node, executor);
    this.#node = node;
  }

  groupBy<const TField extends keyof DB['tables'][TableName] & string>(
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

  withAggregates<
    const T extends {
      [K in keyof DB['tables'][TableName] &
        string]?: readonly (keyof DB['aggregates'][DB['tables'][TableName][K]['type']])[];
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

  paginate(
    page: number,
    limit: number,
  ): AggregationQueryBuilder<DB, TableName, TGroupBy, TAggregations> {
    return this.offset((page - 1) * limit).limit(limit);
  }

  orderBy(
    field: keyof DB['tables'][TableName],
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

  async execute(): Promise<
    AggregateRecord<DB, TableName, TGroupBy, TAggregations>[]
  > {
    const response = await this._executor.execute<
      AggregateRecord<DB, TableName, TGroupBy, TAggregations>[]
    >(this);
    return response;
  }

  compile(): { query: string; variables: Record<string, any> } {
    const query = 'mutation ($metadata: JSON) { execute(metadata: $metadata) }';
    const metadata = [this._prepareMetadata()];
    return { query, variables: { metadata } };
  }

  _prepareMetadata(): any {
    return {
      type: 'aggregate',
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
