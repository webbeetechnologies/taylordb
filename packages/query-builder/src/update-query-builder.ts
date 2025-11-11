import type { AnyDB } from './@types/internal-types.js';
import type { Updatable, UpdateNode } from './@types/update.js';
import { Executor } from './executor.js';
import { FilterableQueryBuilder } from './where-query-builder.js';

export class UpdateQueryBuilder<
  DB extends AnyDB,
  TableName extends keyof DB['tables'],
> extends FilterableQueryBuilder<DB, TableName> {
  #node: UpdateNode;

  constructor(node: UpdateNode, executor: Executor) {
    super(node, executor);
    this.#node = node;
  }

  set(
    values: Updatable<DB['tables'][TableName]>,
  ): UpdateQueryBuilder<DB, TableName> {
    return new UpdateQueryBuilder<DB, TableName>(
      {
        ...this.#node,
        values,
      },
      this._executor,
    );
  }

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
