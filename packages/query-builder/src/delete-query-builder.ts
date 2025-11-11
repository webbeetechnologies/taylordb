import type { DeleteNode } from './@types/delete.js';
import type { AnyDB } from './@types/internal-types.js';
import { Executor } from './executor.js';
import { FilterableQueryBuilder } from './where-query-builder.js';

export class DeleteQueryBuilder<
  DB extends AnyDB,
  TableName extends keyof DB['tables'],
> extends FilterableQueryBuilder<DB, TableName> {
  #node: DeleteNode;

  constructor(node: DeleteNode, executor: Executor) {
    super(node, executor);
    this.#node = node;
  }

  async execute(): Promise<{ affectedRecords: number }> {
    const response = await this._executor.execute<
      { affectedRecords: number }[]
    >(this);

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
