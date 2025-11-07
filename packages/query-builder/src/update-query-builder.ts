import type { AnyDB } from './@types/internal-types.js';
import type { Updatable, UpdateNode } from './@types/update.js';
import { FilterableQueryBuilder } from './where-query-builder.js';

export class UpdateQueryBuilder<
  DB extends AnyDB,
  TableName extends keyof DB,
> extends FilterableQueryBuilder<DB, TableName> {
  #node: UpdateNode;

  constructor(node: UpdateNode) {
    super(node);
    this.#node = node;
  }

  set(
    values: Updatable<DB[TableName]>
  ): UpdateQueryBuilder<DB, TableName> {
    return new UpdateQueryBuilder<DB, TableName>({
      ...this.#node,
      values,
    });
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
      type: 'update',
      tableName: this.#node.tableName,
      values: this.#node.values,
      ...(this.#node.filtersSet.filtersSet.length > 0 ? { filtersSet: this.#node.filtersSet } : {}),
    };
  }
}
