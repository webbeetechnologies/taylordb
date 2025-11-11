import { AggregationQueryBuilder } from './aggregation-query-builder.js';
import { DeleteQueryBuilder } from './delete-query-builder.js';
import { Executor } from './executor.js';
import { InsertQueryBuilder } from './insert-query-builder.js';
import { QueryBuilder } from './query-builder.js';
import { UpdateQueryBuilder } from './update-query-builder.js';

export type AnyQueryBuilder =
  | QueryBuilder<any, any>
  | InsertQueryBuilder<any, any>
  | UpdateQueryBuilder<any, any>
  | DeleteQueryBuilder<any, any>
  | AggregationQueryBuilder<any, any>;

export class BatchQueryBuilder {
  #builders: AnyQueryBuilder[];
  #executor: Executor;

  constructor(builders: AnyQueryBuilder[], executor: Executor) {
    this.#builders = builders;
    this.#executor = executor;
  }

  async execute<T>(): Promise<T> {
    return this.#executor.execute<T>(this);
  }

  compile(): { query: string; variables: Record<string, any> } {
    const query = 'mutation ($metadata: JSON) { execute(metadata: $metadata) }';

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
