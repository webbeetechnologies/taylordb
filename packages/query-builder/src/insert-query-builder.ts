import type { Insertable, InsertNode } from './@types/insert.js';
import type { AnyDB, QueryNode } from './@types/internal-types.js';
import { Executor } from './executor.js';
import { QueryBuilder } from './query-builder.js';
import { SelectionBuilder } from './selection-builder.js';

export class InsertQueryBuilder<DB extends AnyDB, TableName extends keyof DB['tables']> {
  #node: InsertNode;
  #executor: Executor;

  constructor(node: InsertNode, executor: Executor) {
    this.#node = node;
    this.#executor = executor;
  }

  values(
    values: Insertable<DB['tables'][TableName]> | Insertable<DB['tables'][TableName]>[]
  ): InsertQueryBuilder<DB, TableName> {
    return new InsertQueryBuilder(
      {
        ...this.#node,
        createdRecords: Array.isArray(values) ? values : [values],
      },
      this.#executor
    );
  }

  returning<
    K extends
      | keyof DB['tables'][TableName]
      | ((builder: SelectionBuilder<DB, TableName>) => QueryBuilder<DB, any>)
  >(fields: K[]): InsertQueryBuilder<DB, TableName> {
    const newSelects = fields.map(field => {
      if (typeof field === 'function') {
        const builder = new SelectionBuilder<DB, TableName>(this.#executor);
        const subQuery = field(builder);
        return subQuery._node;
      }
      return field as string;
    });

    return new InsertQueryBuilder(
      {
        ...this.#node,
        returning: [...this.#node.returning, ...newSelects],
      },
      this.#executor
    );
  }

  async execute<T>(): Promise<T> {
    return this.#executor.execute<T>(this);
  }

  compile(): {query: string; variables: Record<string, any>} {
    const query = `mutation ($metadata: JSON) { execute(metadata: $metadata) }`;

    const metadata = [this._prepareMetadata()];

    return {
      query,
      variables: {
        metadata,
      },
    };
  }

  _prepareMetadata(): any {
    const buildSelects = (selects: (string | QueryNode)[]): any[] => {
      return selects.map(field => {
        if (typeof field === 'string') {
          return field;
        }
        const subQueryBuilder = new QueryBuilder(field as QueryNode, this.#executor);
        return subQueryBuilder._prepareMetadata();
      });
    };

    const returningSelection = this.#node.returning.length
      ? buildSelects(this.#node.returning)
      : ['id'];

    return {
      type: 'create',
      tableName: this.#node.tableName,
      createdRecords: this.#node.createdRecords,
      returning: returningSelection,
    };
  }
}
