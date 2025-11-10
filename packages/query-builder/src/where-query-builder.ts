import type { ColumnType } from '@taylordb/shared';
import { Filters } from '@webbeetech/dbwand-utilities';
import type { AnyDB, QueryNode } from './@types/internal-types.js';
import { Executor } from './executor.js';

export class FilterableQueryBuilder<
  DB extends AnyDB,
  TableName extends keyof DB['tables'],
> {
  _node: Pick<QueryNode, 'filtersSet'>;
  _executor: Executor;

  constructor(node: Pick<QueryNode, 'filtersSet'>, executor: Executor) {
    this._node = node;
    this._executor = executor;
  }

  where<
    C extends keyof DB['tables'][TableName],
    O extends keyof DB['filters'][DB['tables'][TableName][C] extends ColumnType<
      any,
      any,
      any,
      infer T
    >
      ? T & keyof DB['filters']
      : never]
  >(
    column: C,
    operator: O,
    value: DB['filters'][DB['tables'][TableName][C] extends ColumnType<any, any, any, infer T>
      ? T & keyof DB['filters']
      : never][O]
  ): this;
  where<
    C extends (
      builder: WhereQueryBuilder<DB, TableName>
    ) => FilterableQueryBuilder<DB, TableName>
  >(column: C): this;
  where(column: any, operator?: any, value?: any): this {
    if (typeof column === 'function') {
      const builder = new WhereQueryBuilder<DB, TableName>({
        ...this._node,
        filtersSet: {conjunction: 'and', filtersSet: []},
      }, this._executor);
      const result = column(builder);
      return new (this.constructor as any)({
        ...this._node,
        filtersSet: {
          ...this._node.filtersSet,
          filtersSet: [...this._node.filtersSet.filtersSet, result._node.filtersSet],
        },
      }, this._executor);
    }

    const newWhere: Filters<string> = {field: column as string, operator, value};

    return new (this.constructor as any)({
      ...this._node,
      filtersSet: {
        ...this._node.filtersSet,
        filtersSet: [...this._node.filtersSet.filtersSet, newWhere],
      },
    }, this._executor);
  }

  orWhere<
    C extends keyof DB['tables'][TableName],
    O extends keyof DB['filters'][DB['tables'][TableName][C] extends ColumnType<
      any,
      any,
      any,
      infer T
    >
      ? T & keyof DB['filters']
      : never]
  >(
    column: C,
    operator: O,
    value: DB['filters'][DB['tables'][TableName][C] extends ColumnType<any, any, any, infer T>
      ? T & keyof DB['filters']
      : never][O]
  ): this;
  orWhere<C extends (builder: WhereQueryBuilder<DB, TableName>) => any>(
    column: C
  ): this;
  orWhere(column: any, operator?: any, value?: any): this {
    const newFilters = this._node.filtersSet.filtersSet;

    if (typeof column === 'function') {
      const builder = new WhereQueryBuilder<DB, TableName>({
        ...this._node,
        filtersSet: {conjunction: 'and', filtersSet: []},
      }, this._executor);
      const result = column(builder);
      newFilters.push(result._node.filters);
    } else {
      newFilters.push({field: column as string, operator, value});
    }

    return new (this.constructor as any)({
      ...this._node,
      filtersSet: {
        conjunction: 'or',
        filtersSet: newFilters,
      },
    }, this._executor);
  }
}

export class WhereQueryBuilder<
  DB extends AnyDB,
  TableName extends keyof DB['tables']
> extends FilterableQueryBuilder<DB, TableName> {}
