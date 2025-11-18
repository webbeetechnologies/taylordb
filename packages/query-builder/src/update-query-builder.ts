import type { AnyDB } from './@types/internal-types.js';
import type { Updatable, UpdateNode } from './@types/update.js';
import { Executor } from './executor.js';
import { FilterableQueryBuilder } from './where-query-builder.js';

/**
 * A query builder for updating records in the database.
 * @template DB - The database type.
 * @template TableName - The name of the table to update.
 */
export class UpdateQueryBuilder<
  DB extends AnyDB,
  TableName extends keyof DB,
> extends FilterableQueryBuilder<DB, TableName> {
  #node: UpdateNode;

  constructor(node: UpdateNode, executor: Executor) {
    super(node, executor);
    this.#node = node;
  }

  /**
   * Sets the values to update for the records that match the where clauses.
   * @param values - An object containing the fields and their new values.
   * @returns The `UpdateQueryBuilder` instance for chaining.
   *
   * @example
   * ```typescript
   * const { affectedRecords } = await qb
   *   .update('users')
   *   .set({ name: 'New Name' })
   *   .where('id', '=', 1)
   *   .execute();
   * ```
   */
  set(values: Updatable<DB[TableName]>): UpdateQueryBuilder<DB, TableName> {
    return new UpdateQueryBuilder<DB, TableName>(
      {
        ...this.#node,
        values,
      },
      this._executor,
    );
  }

  /**
   * Executes the update query.
   * @returns A promise that resolves with the number of affected records.
   *
   * @example
   * ```typescript
   * const { affectedRecords } = await qb
   *   .update('users')
   *   .set({ name: 'New Name' })
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
      type: 'update',
      tableName: this.#node.tableName,
      values: this.#node.values,
      ...(this.#node.filtersSet.filtersSet.length > 0
        ? { filtersSet: this.#node.filtersSet }
        : {}),
    };
  }
}
