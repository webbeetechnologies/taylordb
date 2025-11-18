import type { LinkColumnType } from '@taylordb/shared';
import type { AnyDB } from './@types/internal-types.js';
import { LinkColumnNames } from './@types/query-builder.js';
import { Executor } from './executor.js';
import { QueryBuilder } from './query-builder.js';

/**
 * A builder for creating subqueries on linked records.
 * This is used internally by the `with` method on the `QueryBuilder`.
 * @template DB - The database type.
 * @template CurrentTableName - The name of the table the selection is starting from.
 */
export class SelectionBuilder<
  DB extends AnyDB,
  CurrentTableName extends keyof DB,
> {
  _executor: Executor;

  constructor(executor: Executor) {
    this._executor = executor;
  }

  /**
   * Creates a new query builder for a linked table.
   * @param from - The name of the link field to select from.
   * @returns A new `QueryBuilder` instance for the linked table.
   */
  useLink<LinkName extends LinkColumnNames<DB[CurrentTableName]> & string>(
    from: LinkName,
  ) {
    return new QueryBuilder<
      DB,
      DB[CurrentTableName][LinkName] extends LinkColumnType<any, boolean>
        ? DB[CurrentTableName][LinkName]['linkedTo']
        : never,
      object,
      LinkName
    >(
      {
        field: from,
        fields: [],
        filtersSet: { conjunction: 'and', filtersSet: [] },
        queryType: 'link',
      },
      this._executor,
    );
  }
}
