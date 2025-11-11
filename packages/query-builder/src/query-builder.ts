import { FieldWithDirection, LinkColumnType } from '@taylordb/shared';
import { z } from 'zod';
import { AggregateNode } from './@types/aggregate.js';
import {
  AnyDB,
  QueryNode,
  RootQueryNode,
  SelectionQueryNode,
} from './@types/internal-types.js';
import { LinkColumnNames, NonLinkColumnNames } from './@types/query-builder.js';
import {
  InferDataType,
  ResolveSelection,
  ResolveWithObject,
  ResolveWithPlain,
} from './@types/type-helpers.js';
import { AggregationQueryBuilder } from './aggregation-query-builder.js';
import { AnyQueryBuilder, BatchQueryBuilder } from './batch-query-builder.js';
import { DeleteQueryBuilder } from './delete-query-builder.js';
import { Executor } from './executor.js';
import { InsertQueryBuilder } from './insert-query-builder.js';
import { SelectionBuilder } from './selection-builder.js';
import { UpdateQueryBuilder } from './update-query-builder.js';
import { FilterableQueryBuilder } from './where-query-builder.js';

export class QueryBuilder<
  DB extends AnyDB,
  TableName extends keyof DB['tables'],
  Selection = object,
  LinkName = null,
> extends FilterableQueryBuilder<DB, TableName> {
  declare _node: QueryNode;

  constructor(node: QueryNode, executor: Executor) {
    super(node, executor);
    this._node = node;
  }

  select<
    const TFields extends readonly NonLinkColumnNames<
      DB['tables'][TableName]
    >[],
  >(
    fields: TFields,
  ): QueryBuilder<
    DB,
    TableName,
    ResolveSelection<DB, TableName, TFields, Selection>
  > {
    return new QueryBuilder(
      {
        ...this._node,
        fields: [...this._node.fields, ...fields],
      } as QueryNode,
      this._executor,
    );
  }

  selectAll(): QueryBuilder<
    DB,
    TableName,
    Selection & {
      [K in keyof DB['tables'][TableName]]: InferDataType<
        DB['tables'][TableName][K]
      >;
    }
  > {
    return new QueryBuilder(
      {
        ...this._node,
        fields: ['*'],
      } as QueryNode,
      this._executor,
    );
  }

  with<
    const TArg extends
      | (LinkColumnNames<DB['tables'][TableName]> & string)
      | readonly (LinkColumnNames<DB['tables'][TableName]> & string)[],
  >(
    relations: TArg,
  ): QueryBuilder<
    DB,
    TableName,
    ResolveWithPlain<DB, TableName, TArg, Selection>
  >;
  with<
    const TArg extends {
      [K in LinkColumnNames<DB['tables'][TableName]>]?: (
        qb: QueryBuilder<
          DB,
          DB['tables'][TableName][K] extends LinkColumnType<any>
            ? DB['tables'][TableName][K]['linkedTo']
            : never,
          object,
          K
        >,
      ) => QueryBuilder<DB, any, any, any>;
    },
  >(
    relations: TArg,
  ): QueryBuilder<DB, TableName, ResolveWithObject<TArg, Selection>>;
  with(
    arg:
      | (LinkColumnNames<DB['tables'][TableName]> & string)
      | (LinkColumnNames<DB['tables'][TableName]> & string)[]
      | Record<string, (qb: any) => any>,
  ): QueryBuilder<DB, TableName, any> {
    if (typeof arg === 'string' || Array.isArray(arg)) {
      const relationNames = (Array.isArray(arg) ? arg : [arg]) as string[];
      const newSelects = relationNames.map(relationName => {
        const selectionBuilder = new SelectionBuilder<DB, TableName>(
          this._executor,
        );
        const subQuery = selectionBuilder
          .useLink(relationName as any)
          .selectAll();
        return subQuery._node;
      });

      return new QueryBuilder(
        {
          ...this._node,
          fields: [...this._node.fields, ...newSelects],
        } as QueryNode,
        this._executor,
      );
    }

    const relations = arg as Record<string, (qb: any) => any>;
    const newSelects = Object.entries(relations).map(
      ([relationName, configFn]) => {
        const selectionBuilder = new SelectionBuilder<DB, TableName>(
          this._executor,
        );
        const initialSubQueryBuilder = selectionBuilder.useLink(
          relationName as any,
        );
        const configuredSubQueryBuilder = configFn(initialSubQueryBuilder);
        return configuredSubQueryBuilder._node;
      },
    );

    return new QueryBuilder(
      {
        ...this._node,
        fields: [...this._node.fields, ...newSelects],
      } as QueryNode,
      this._executor,
    );
  }

  limit(count: number): QueryBuilder<DB, TableName, Selection, LinkName> {
    return new QueryBuilder(
      {
        ...this._node,
        pagination: { ...this._node.pagination, limit: count },
      },
      this._executor,
    );
  }

  offset(count: number): QueryBuilder<DB, TableName, Selection, LinkName> {
    return new QueryBuilder(
      {
        ...this._node,
        pagination: { ...this._node.pagination, offset: count },
      },
      this._executor,
    );
  }

  paginate(
    page: number,
    limit: number,
  ): QueryBuilder<DB, TableName, Selection, LinkName> {
    return this.offset((page - 1) * limit).limit(limit);
  }

  orderBy(
    field: keyof DB['tables'][TableName],
    direction: 'asc' | 'desc' = 'asc',
  ): QueryBuilder<DB, TableName, Selection, LinkName> {
    const newSorting: FieldWithDirection<string> = {
      field: field as string,
      direction,
    };

    return new QueryBuilder(
      {
        ...this._node,
        sorting: [...(this._node.sorting || []), newSorting],
      },
      this._executor,
    );
  }

  async execute(): Promise<Selection[]> {
    const response = await this._executor.execute<Selection>(this);

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

  _prepareMetadata() {
    if (this.isSelectionQueryNode(this._node)) {
      return {
        field: this._node.field,
        fields: this._node.fields.map(field => {
          if (typeof field === 'string') {
            return field;
          }

          return new QueryBuilder(
            field as QueryNode,
            this._executor,
          )._prepareMetadata();
        }),

        ...(this._node.filtersSet.filtersSet.length > 0
          ? { filtersSet: this._node.filtersSet }
          : {}),
        ...(this._node.pagination ? { pagination: this._node.pagination } : {}),
        ...(this._node.sorting ? { sorting: this._node.sorting } : {}),
      };
    }

    if (this.isRootQueryNode(this._node)) {
      return {
        type: 'select',
        tableName: this._node.tableName,
        fields: this._node.fields.map(field => {
          if (typeof field === 'string') {
            return field;
          }

          return new QueryBuilder(
            field as QueryNode,
            this._executor,
          )._prepareMetadata();
        }),
        ...(this._node.filtersSet.filtersSet.length > 0
          ? { filtersSet: this._node.filtersSet }
          : {}),
        ...(this._node.pagination ? { pagination: this._node.pagination } : {}),
        ...(this._node.sorting ? { sorting: this._node.sorting } : {}),
      };
    }

    throw new Error('Invalid query node');
  }

  isSelectionQueryNode(node: QueryNode): node is SelectionQueryNode {
    return node.queryType === 'link';
  }

  isRootQueryNode(node: QueryNode): node is RootQueryNode {
    return node.queryType === 'root';
  }
}

export class RootQueryBuilder<DB extends AnyDB> {
  #executor: Executor;

  constructor(config: { baseUrl: string; apiKey: string }) {
    this.#executor = new Executor(config.baseUrl, config.apiKey);
  }
  selectFrom<
    TableName extends keyof Omit<
      DB['tables'],
      'selectTable' | 'attachmentTable' | 'collaboratorsTable'
    > &
      string,
  >(from: TableName): QueryBuilder<DB, TableName> {
    return new QueryBuilder<DB, TableName>(
      {
        tableName: from,
        fields: [],
        filtersSet: { conjunction: 'and', filtersSet: [] },
        type: 'select',
        queryType: 'root',
      },
      this.#executor,
    );
  }

  insertInto<
    TableName extends keyof Omit<
      DB['tables'],
      'selectTable' | 'attachmentTable' | 'collaboratorsTable'
    > &
      string,
  >(into: TableName): InsertQueryBuilder<DB, TableName> {
    return new InsertQueryBuilder<DB, TableName>(
      {
        tableName: into,
        createdRecords: [],
        returning: [],
        type: 'create',
      },
      this.#executor,
    );
  }

  update<
    TableName extends keyof Omit<
      DB['tables'],
      'selectTable' | 'attachmentTable' | 'collaboratorsTable'
    > &
      string,
  >(tableName: TableName): UpdateQueryBuilder<DB, TableName> {
    return new UpdateQueryBuilder<DB, TableName>(
      {
        tableName: tableName,
        values: {},
        filtersSet: { conjunction: 'and', filtersSet: [] },
        type: 'update',
      },
      this.#executor,
    );
  }

  deleteFrom<
    TableName extends keyof Omit<
      DB['tables'],
      'selectTable' | 'attachmentTable' | 'collaboratorsTable'
    > &
      string,
  >(tableName: TableName): DeleteQueryBuilder<DB, TableName> {
    return new DeleteQueryBuilder<DB, TableName>(
      {
        tableName: tableName,
        deletedRecordIds: [],
        filtersSet: { conjunction: 'and', filtersSet: [] },
        type: 'delete',
      },
      this.#executor,
    );
  }

  batch(builders: AnyQueryBuilder[]): BatchQueryBuilder {
    return new BatchQueryBuilder(builders, this.#executor);
  }

  aggregateFrom<
    TableName extends keyof Omit<
      DB['tables'],
      'selectTable' | 'attachmentTable' | 'collaboratorsTable'
    > &
      string,
  >(tableName: TableName): AggregationQueryBuilder<DB, TableName> {
    const node: AggregateNode = {
      tableName: tableName,
      type: 'aggregation',
      filtersSet: { conjunction: 'and', filtersSet: [] },
      groupings: [],
      aggregations: {},
    };
    return new AggregationQueryBuilder<DB, TableName>(node, this.#executor);
  }
}

const QBConfigSchema = z.object({
  baseUrl: z.string().url(),
  apiKey: z.string().nonempty(),
});

export function createQueryBuilder<DB extends AnyDB>(config: {
  baseUrl: string;
  apiKey: string;
}) {
  QBConfigSchema.parse(config);
  return new RootQueryBuilder<DB>(config);
}
