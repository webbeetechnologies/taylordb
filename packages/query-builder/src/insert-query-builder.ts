import {ColumnType} from '@taylordb/shared';
import {EnumType, jsonToGraphQLQuery} from 'json-to-graphql-query';
import {makeMutationInputTypeName} from './graphql/mutation-schema-names.js';
import type {AnyDB, QueryNode} from './internal-types.js';
import {QueryBuilder} from './query-builder.js';
import {SelectionBuilder} from './selection-builder.js';

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
    const variables: Record<string, any> = {};
    const varDefinitions: Record<string, string> = {};

    const recordsVarName = 'records';
    varDefinitions[recordsVarName] = `[${makeMutationInputTypeName(
      this.#node.into
    )}]`;
    variables[recordsVarName] = this.#node.values;

    const selection = this.#node.returning.length
      ? this.#node.returning
      : ['id'];
    const returningSelection = selection.reduce((acc, field) => {
      if (typeof field === 'string') {
        acc[field] = true;
      }
      return acc;
    }, {} as Record<string, any>);

    const query = {
      mutation: {
        __variables: varDefinitions,
        [this.#node.into]: {
          createRecord: {
            __args: {
              records: new EnumType('$' + recordsVarName),
            },
            ...returningSelection,
          },
        },
      },
    };

    return {
      query: jsonToGraphQLQuery(query, {pretty: true}),
      variables: variables,
    };
  }
}
