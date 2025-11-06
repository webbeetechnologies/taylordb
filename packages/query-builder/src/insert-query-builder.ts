import { ColumnType } from '@taylordb/shared';
import type { AnyDB, QueryNode } from './internal-types.js';
import { QueryBuilder } from './query-builder.js';
import { SelectionBuilder } from './selection-builder.js';

type InsertNode = {
  into: string;
  values: any | any[];
  returning: (string | QueryNode)[];
};

type Insertable<T> = {
  [K in keyof T]?: T[K] extends ColumnType<any, any, infer I, any> ? I : never;
};

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
      values: values,
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
    const query = `query ($metadata: [ExecutionMetadata]) {
  execute(metadata: $metadata)
}`;

    const metadata = [this._prepareMetadata()];

    return {
      query,
      variables: {
        metadata,
      },
    };
  }

  private _prepareMetadata(): any {
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
      type: 'insert',
      tableName: this.#node.into,
      values: this.#node.values,
      returning: returningSelection,
    };
  }
}
