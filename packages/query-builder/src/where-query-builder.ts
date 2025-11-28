import {
  AbstractLinkColumn,
  AnyDB,
  Filter,
  FilterableNode,
} from './@types/internal-types.js';
import { ColumnNames } from './@types/query-builder.js';
import { Executor } from './executor.js';
import { SelectionBuilder } from './selection-builder.js';

/**
 * A base class for query builders that support filtering.
 * It provides the `where` and `orWhere` methods.
 * @template DB - The database type.
 * @template TableName - The name of the table to query.
 */
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

  /**
   * Adds a `where` clause to the query.
   * This can be a simple condition, a nested query, or a cross-filter on a linked table.
   *
   * @param field - The field to filter on.
   * @param operator - The filter operator.
   * @param value - The value to filter by.
   * @returns The query builder instance for chaining.
   *
   * @example
   * ```typescript
   * const users = await qb
   *   .selectFrom('users')
   *   .where('name', '=', 'John Doe')
   *   .execute();
   * ```
   *
   * @example
   * ```typescript
   * const users = await qb
   *   .selectFrom('users')
   *   .where((qb) =>
   *     qb.where('name', '=', 'John Doe').orWhere('email', '=', 'john.doe@example.com')
   *   )
   *   .execute();
   * ```
   *
   * @example
   * ```typescript
   * const users = await qb
   *   .selectFrom('users')
   *   .where('posts', 'hasAnyOf', (qb) => qb.where('isPublished', '=', true))
   *   .execute();
   * ```
   */
  where<
    TField extends ColumnNames<DB[TableName]> & string,
    TOperator extends keyof DB[TableName][TField]['filters'],
  >(
    field: TField,
    operator: TOperator,
    value?: DB[TableName][TField] extends AbstractLinkColumn
      ?
          | ((
              qb: FilterableQueryBuilder<
                DB,
                DB[TableName][TField] extends AbstractLinkColumn
                  ? DB[TableName][TField]['linkedTo']
                  : never
              >,
            ) => FilterableQueryBuilder<
              DB,
              DB[TableName][TField] extends AbstractLinkColumn
                ? DB[TableName][TField]['linkedTo']
                : never
            >)
          | DB[TableName][TField]['filters'][TOperator]
      : DB[TableName][TField]['filters'][TOperator] extends never
        ? undefined
        : DB[TableName][TField]['filters'][TOperator],
  ): this;
  where<
    C extends (
      builder: WhereQueryBuilder<DB, TableName>,
    ) => WhereQueryBuilder<DB, TableName>,
  >(column: C): this;
  where(
    fieldOrFn:
      | ColumnNames<DB[TableName]>
      | ((
          qb: WhereQueryBuilder<DB, TableName>,
        ) => FilterableQueryBuilder<DB, TableName>),
    operator?: string,
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
        value: ['cross-table', configuredSubQueryBuilder._node.filtersSet],
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

  /**
   * Adds an `orWhere` clause to the query.
   * This is similar to `where`, but the condition will be joined with `OR`.
   *
   * @param field - The field to filter on.
   * @param operator - The filter operator.
   * @param value - The value to filter by.
   * @returns The query builder instance for chaining.
   *
   * @example
   * ```typescript
   * const users = await qb
   *   .selectFrom('users')
   *   .where('name', '=', 'John Doe')
   *   .orWhere('name', '=', 'Jane Doe')
   *   .execute();
   * ```
   */
  orWhere<
    TField extends ColumnNames<DB[TableName]> & string,
    TOperator extends keyof DB[TableName][TField]['filters'],
  >(
    field: TField,
    operator: TOperator,
    value: DB[TableName][TField] extends AbstractLinkColumn
      ? (
          qb: FilterableQueryBuilder<
            DB,
            DB[TableName][TField] extends AbstractLinkColumn
              ? DB[TableName][TField]['linkedTo']
              : never
          >,
        ) =>
          | FilterableQueryBuilder<
              DB,
              DB[TableName][TField] extends AbstractLinkColumn
                ? DB[TableName][TField]['linkedTo']
                : never
            >
          | DB[TableName][TField]['filters'][TOperator]
      : DB[TableName][TField]['filters'][TOperator],
  ): this;
  orWhere<
    C extends (
      builder: WhereQueryBuilder<DB, TableName>,
    ) => WhereQueryBuilder<DB, TableName>,
  >(column: C): this;
  orWhere(
    fieldOrFn: ColumnNames<DB[TableName]> | ((...args: any[]) => any),
    operator?: string,
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
