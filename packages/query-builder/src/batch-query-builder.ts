import { DeleteQueryBuilder } from './delete-query-builder.js';
import { InsertQueryBuilder } from './insert-query-builder.js';
import { QueryBuilder } from './query-builder.js';
import { UpdateQueryBuilder } from './update-query-builder.js';

export type AnyQueryBuilder =
  | QueryBuilder<any, any>
  | InsertQueryBuilder<any, any>
  | UpdateQueryBuilder<any, any>
  | DeleteQueryBuilder<any, any>;

export class BatchQueryBuilder {
  #builders: AnyQueryBuilder[];

  constructor(builders: AnyQueryBuilder[]) {
    this.#builders = builders;
  }

  compile(): {query: string; variables: Record<string, any>} {
    const query = `mutation ($metadata: GraphQLJSON) { execute(metadata: $metadata) }`;

    const metadata = this.#builders.map(builder => {
      return builder._prepareMetadata();
    });

    return {
      query,
      variables: {
        metadata,
      },
    };
  }
}
