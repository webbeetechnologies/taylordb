import type { Insertable, InsertNode } from './@types/insert.js';
import type { AnyDB, QueryNode } from './@types/internal-types.js';
import { QueryBuilder } from './query-builder.js';
import { SelectionBuilder } from './selection-builder.js';

export class InsertQueryBuilder<DB extends AnyDB, TableName extends keyof DB> {
  #node: InsertNode;

  constructor(node: InsertNode) {
    this.#node = node;
  }

  values(
    values: Insertable<DB[TableName]> | Insertable<DB[TableName]>[]
  ): InsertQueryBuilder<DB, TableName> {
    return new InsertQueryBuilder({
      ...this.#node,
      createdRecords: Array.isArray(values) ? values : [values],
    });
  }

  returning<
    K extends
      | keyof DB[TableName]
      | ((builder: SelectionBuilder<DB, TableName>) => QueryBuilder<DB, any>)
  >(fields: K[]): InsertQueryBuilder<DB, TableName> {
    const newSelects = fields.map(field => {
      if (typeof field === 'function') {
        const builder = new SelectionBuilder<DB, TableName>();
        const subQuery = field(builder);
        return subQuery._node;
      }
      return field as string;
    });

    return new InsertQueryBuilder({
      ...this.#node,
      returning: [...this.#node.returning, ...newSelects],
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
    const buildSelects = (selects: (string | QueryNode)[]): any[] => {
      return selects.map(field => {
        if (typeof field === 'string') {
          return field;
        }
        const subQueryBuilder = new QueryBuilder(field as QueryNode);
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
