import { LinkColumnType } from '@taylordb/shared';
import {
  AnyDB,
  Filter,
  FilterableNode,
  FilterOperator,
} from './@types/internal-types.js';
import {
  ColumnNames,
  LinkColumnNames,
  NonLinkColumnNames,
} from './@types/query-builder.js';
import { InferDataType } from './@types/type-helpers.js';
import { Executor } from './executor.js';
import { SelectionBuilder } from './selection-builder.js';

export class FilterableQueryBuilder<
  DB extends AnyDB,
  TableName extends keyof DB,
> {
  declare _node: FilterableNode;
  _executor: Executor;

  constructor(node: FilterableNode, executor: Executor) {
    this._node = node;
    this._executor = executor;
  }

  where<TField extends LinkColumnNames<DB[TableName]> & string>(
    field: TField,
    operator: 'hasAnyOf' | 'hasAllOf' | 'hasNoneOf',
    value: (
      qb: FilterableQueryBuilder<
        DB,
        DB[TableName][TField] extends LinkColumnType<any>
          ? DB[TableName][TField]['linkedTo']
          : never
      >,
    ) => FilterableQueryBuilder<
      DB,
      DB[TableName][TField] extends LinkColumnType<any>
        ? DB[TableName][TField]['linkedTo']
        : never
    >,
  ): this;
  where<
    TField extends NonLinkColumnNames<DB[TableName]> & string,
    TOperator extends keyof DB[TableName][TField]['filters'],
  >(
    field: TField,
    operator: TOperator,
    value: DB[TableName][TField]['filters'][TOperator],
  ): this;
  where(
    fieldOrFn:
      | ColumnNames<DB[TableName]>
      | ((
          qb: WhereQueryBuilder<DB, TableName>,
        ) => FilterableQueryBuilder<DB, TableName>),
    operator?: FilterOperator,
    value?: unknown,
  ): this {
    if (typeof fieldOrFn === 'function') {
      const builder = new WhereQueryBuilder<DB, TableName>(
        {
          ...this._node,
          filtersSet: { conjunction: 'and', filtersSet: [] },
        },
        this._executor,
      );
      const result = fieldOrFn(builder);
      const newNode: FilterableNode = {
        ...this._node,
        filtersSet: {
          ...this._node.filtersSet,
          filtersSet: [
            ...this._node.filtersSet.filtersSet,
            result._node.filtersSet,
          ],
        },
      };
      // @ts-expect-error cannot instantiate an abstract class
      return new this.constructor(newNode, this._executor);
    }

    if (typeof value === 'function') {
      const selectionBuilder = new SelectionBuilder<DB, TableName>(
        this._executor,
      );
      const initialSubQueryBuilder = selectionBuilder.useLink(fieldOrFn as any);
      const configuredSubQueryBuilder = value(initialSubQueryBuilder);

      const newFilter: Filter = {
        field: fieldOrFn as string,
        operator: operator!,
        value: ['cross-filter', configuredSubQueryBuilder._node.filtersSet],
      };

      const newNode: FilterableNode = {
        ...this._node,
        filtersSet: {
          ...this._node.filtersSet,
          filtersSet: [...this._node.filtersSet.filtersSet, newFilter],
        },
      };

      // @ts-expect-error cannot instantiate an abstract class
      return new this.constructor(newNode, this._executor);
    }

    const newFilter: Filter = {
      field: fieldOrFn as string,
      operator: operator!,
      value,
    };

    const newNode: FilterableNode = {
      ...this._node,
      filtersSet: {
        ...this._node.filtersSet,
        filtersSet: [...this._node.filtersSet.filtersSet, newFilter],
      },
    };

    // @ts-expect-error cannot instantiate an abstract class
    return new this.constructor(newNode, this._executor);
  }

  orWhere<C extends (builder: WhereQueryBuilder<DB, TableName>) => any>(
    column: C,
  ): this;
  orWhere<TField extends ColumnNames<DB[TableName]> & string>(
    field: TField,
    operator: FilterOperator,
    value: InferDataType<DB[TableName][TField]>,
  ): this;
  orWhere(
    fieldOrFn: ColumnNames<DB[TableName]> | ((...args: any[]) => any),
    operator?: FilterOperator,
    value?: unknown,
  ): this {
    // Keeping a basic implementation for orWhere from what was in the file
    const newFilters = this._node.filtersSet.filtersSet;

    if (typeof fieldOrFn === 'function') {
      const builder = new WhereQueryBuilder<DB, TableName>(
        {
          ...this._node,
          filtersSet: { conjunction: 'and', filtersSet: [] },
        },
        this._executor,
      );
      const result = fieldOrFn(builder);
      newFilters.push(result._node.filtersSet);
    } else {
      newFilters.push({
        field: fieldOrFn as string,
        operator: operator!,
        value,
      });
    }

    // @ts-expect-error cannot instantiate an abstract class
    return new this.constructor(
      {
        ...this._node,
        filtersSet: {
          conjunction: 'or',
          filtersSet: newFilters,
        },
      },
      this._executor,
    );
  }
}

export class WhereQueryBuilder<
  DB extends AnyDB,
  TableName extends keyof DB,
> extends FilterableQueryBuilder<DB, TableName> {}
