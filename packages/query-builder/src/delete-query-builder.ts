import type { DeleteNode } from './@types/delete.js';
import type { AnyDB } from './@types/internal-types.js';
import { Executor } from './executor.js';
import { FilterableQueryBuilder } from './where-query-builder.js';

/**
 * A query builder for deleting records from the database.
 * @template DB - The database type.
 * @template TableName - The name of the table to delete from.
 */
export class DeleteQueryBuilder<
  DB extends AnyDB,
  TableName extends keyof DB,
> extends FilterableQueryBuilder<DB, TableName> {
  #node: DeleteNode;

  constructor(node: DeleteNode, executor: Executor) {
    super(node, executor);
    this.#node = node;
  }

  /**
   * Executes the delete query.
   * @returns A promise that resolves with the number of affected records.
   *
   * @example
   * ```typescript
   * const { affectedRecords } = await qb
   *   .deleteFrom('users')
   *   .where('id', '=', 1)
   *   .execute();
   * ```
   */
  async execute(): Promise<{ affectedRecords: number }> {
    const response =
      await this._executor.execute<{ affectedRecords: number }[]>(this);

    return response[0];
  }

  compile(): { query: string; variables: Record<string, any> } {
    const query = 'mutation ($metadata: JSON) { execute(metadata: $metadata) }';

    const metadata = [this._prepareMetadata()];

    return {
      query,
      variables: {
        metadata,
      },
    };
  }

  _prepareMetadata(): any {
    return {
      type: 'delete',
      tableName: this.#node.tableName,
      ...(this.#node.filtersSet.filtersSet.length > 0
        ? { filtersSet: this.#node.filtersSet }
        : {}),
    };
  }
}
