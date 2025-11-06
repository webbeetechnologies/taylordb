import type { ColumnType, Filters } from '@taylordb/shared';
import { Filters as DBFilters } from '@webbeetechnologies/dbwand-utilities/index.js';
import type { AnyDB, QueryNode } from './internal-types.js';

export class FilterableQueryBuilder<
  DB extends AnyDB,
  TableName extends keyof DB
> {
  _node: QueryNode;

  constructor(node: QueryNode) {
    this._node = node;
  }

  where<
    C extends keyof DB[TableName],
    O extends keyof Filters[DB[TableName][C] extends ColumnType<
      any,
      any,
      any,
      infer T
    >
      ? T & keyof Filters
      : never]['operators']
  >(
    column: C,
    operator: O,
    value: Filters[DB[TableName][C] extends ColumnType<any, any, any, infer T>
      ? T & keyof Filters
      : never]['operators'][O]
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
      });
      const result = column(builder);
      return new (this.constructor as any)({
        ...this._node,
        filters: {
          ...this._node.filtersSet,
          filters: [...this._node.filtersSet.filtersSet, result._node.filters],
        },
      });
    }

    const newWhere: DBFilters<string> = {field: column as string, operator, value};

    return new (this.constructor as any)({
      ...this._node,
      filters: {
        ...this._node.filtersSet,
        filters: [...this._node.filtersSet.filtersSet, newWhere],
      },
    });
  }

  orWhere<
    C extends keyof DB[TableName],
    O extends keyof Filters[DB[TableName][C] extends ColumnType<
      any,
      any,
      any,
      infer T
    >
      ? T & keyof Filters
      : never]['operators']
  >(
    column: C,
    operator: O,
    value: Filters[DB[TableName][C] extends ColumnType<any, any, any, infer T>
      ? T & keyof Filters
      : never]['operators'][O]
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
      });
      const result = column(builder);
      newFilters.push(result._node.filters);
    } else {
      newFilters.push({field: column as string, operator, value});
    }

    return new (this.constructor as any)({
      ...this._node,
      filters: {
        ...this._node.filters,
        conjunction: 'or',
        filters: newFilters,
      },
    });
  }
}

export class WhereQueryBuilder<
  DB extends AnyDB,
  TableName extends keyof DB
> extends FilterableQueryBuilder<DB, TableName> {}
