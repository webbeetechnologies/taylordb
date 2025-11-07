import type { DeleteNode } from './@types/delete.js';
import type { AnyDB } from './@types/internal-types.js';
import { FilterableQueryBuilder } from './where-query-builder.js';

export class DeleteQueryBuilder<
  DB extends AnyDB,
  TableName extends keyof DB,
> extends FilterableQueryBuilder<DB, TableName> {
  #node: DeleteNode;

  constructor(node: DeleteNode) {
    super(node);
    this.#node = node;
  }

  compile(): {query: string; variables: Record<string, any>} {
    const query = `mutation ($metadata: GraphQLJSON) { execute(metadata: $metadata) }`;

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
        ? {filtersSet: this.#node.filtersSet}
        : {}),
    };
  }
}
