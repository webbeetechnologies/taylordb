import { LinkColumnType } from '@taylordb/shared';
import { FieldWithDirection } from '@webbeetechnologies/dbwand-utilities/index.js';
import {
  AnyDB,
  QueryNode,
  RootQueryNode,
  SelectionQueryNode,
} from './@types/internal-types.js';
import {
  LinkColumnNames,
  NonLinkColumnNames,
} from './@types/query-builder.js';
import { AnyQueryBuilder, BatchQueryBuilder } from './batch-query-builder.js';
import { DeleteQueryBuilder } from './delete-query-builder.js';
import { InsertQueryBuilder } from './insert-query-builder.js';
import { SelectionBuilder } from './selection-builder.js';
import { UpdateQueryBuilder } from './update-query-builder.js';
import { FilterableQueryBuilder } from './where-query-builder.js';

export class QueryBuilder<
  DB extends AnyDB,
  TableName extends keyof DB
> extends FilterableQueryBuilder<DB, TableName> {
  declare _node: QueryNode;

  constructor(node: QueryNode) {
    super(node);
    this._node = node;
  }

  select<
    K extends
      | NonLinkColumnNames<DB[TableName]>
      | ((builder: SelectionBuilder<DB, TableName>) => QueryBuilder<DB, any>)
  >(fields: K[]): QueryBuilder<DB, TableName> {
    const newSelects = fields.map(field => {
      if (typeof field === 'function') {
        const builder = new SelectionBuilder<DB, TableName>();
        const subQuery = field(builder);
        return subQuery._node;
      }
      return field as string;
    });

    return new QueryBuilder({
      ...this._node,
      fields: [...this._node.fields, ...newSelects],
    } as QueryNode);
  }

  selectAll(): QueryBuilder<DB, TableName> {
    return new QueryBuilder({
      ...this._node,
      fields: ['*'],
    } as QueryNode);
  }

  with(
    relations:
      | (LinkColumnNames<DB[TableName]> & string)
      | (LinkColumnNames<DB[TableName]> & string)[]
  ): QueryBuilder<DB, TableName>;
  with(
    relations: {
      [K in LinkColumnNames<DB[TableName]>]?: (
        qb: QueryBuilder<
          DB,
          DB[TableName][K] extends LinkColumnType<any>
            ? DB[TableName][K]['linkedTo']
            : never
        >
      ) => QueryBuilder<
        DB,
        DB[TableName][K] extends LinkColumnType<any>
          ? DB[TableName][K]['linkedTo']
          : never
      >;
    }
  ): QueryBuilder<DB, TableName>;
  with(
    arg:
      | (LinkColumnNames<DB[TableName]> & string)
      | (LinkColumnNames<DB[TableName]> & string)[]
      | Record<string, (qb: any) => any>
  ): QueryBuilder<DB, TableName> {
    if (typeof arg === 'string' || Array.isArray(arg)) {
      const relationNames = (Array.isArray(arg) ? arg : [arg]) as string[];
      const newSelects = relationNames.map(relationName => {
        const selectionBuilder = new SelectionBuilder<DB, TableName>();
        const subQuery = selectionBuilder
          .useLink(relationName as any)
          .selectAll();
        return subQuery._node;
      });

      return new QueryBuilder({
        ...this._node,
        fields: [...this._node.fields, ...newSelects],
      } as QueryNode);
    }

    const relations = arg as Record<string, (qb: any) => any>;
    const newSelects = Object.entries(relations).map(
      ([relationName, configFn]) => {
        const selectionBuilder = new SelectionBuilder<DB, TableName>();
        const initialSubQueryBuilder = selectionBuilder.useLink(
          relationName as any
        );
        const configuredSubQueryBuilder = configFn(initialSubQueryBuilder);
        return configuredSubQueryBuilder._node;
      }
    );

    return new QueryBuilder({
      ...this._node,
      fields: [...this._node.fields, ...newSelects],
    } as QueryNode);
  }

  limit(count: number): QueryBuilder<DB, TableName> {
    return new QueryBuilder({
      ...this._node,
      pagination: {...this._node.pagination, limit: count},
    });
  }

  offset(count: number): QueryBuilder<DB, TableName> {
    return new QueryBuilder({
      ...this._node,
      pagination: {...this._node.pagination, offset: count},
    });
  }

  paginate(page: number, limit: number): QueryBuilder<DB, TableName> {
    return this.offset((page - 1) * limit).limit(limit);
  }

  orderBy(
    field: keyof DB[TableName],
    direction: 'asc' | 'desc' = 'asc'
  ): QueryBuilder<DB, TableName> {
    const newSorting: FieldWithDirection<string> = {
      field: field as string,
      direction,
    };

    return new QueryBuilder({
      ...this._node,
      sorting: [...(this._node.sorting || []), newSorting],
    });
  }

  compile(): {query: string; variables: Record<string, any>} {
    const query = `mutation ($metadata: GraphQLJSON) {
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

  _prepareMetadata() {
    if (this.isSelectionQueryNode(this._node)) {
      return {
        field: this._node.field,
        fields: this._node.fields.map(field => {
          if (typeof field === 'string') {
            return field;
          }

          return new QueryBuilder(field as QueryNode)._prepareMetadata();
        }),

        ...(this._node.filtersSet.filtersSet.length > 0 ? { filtersSet: this._node.filtersSet } : {}),
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

          return new QueryBuilder(field as QueryNode)._prepareMetadata();
        }),
        ...(this._node.filtersSet.filtersSet.length > 0 ? { filtersSet: this._node.filtersSet } : {}),
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
  selectFrom<
    TableName extends keyof Omit<
      DB,
      'selectTable' | 'attachmentTable' | 'collaboratorsTable'
    > &
      string
  >(from: TableName): QueryBuilder<DB, TableName> {
    return new QueryBuilder<DB, TableName>({
      tableName: from,
      fields: [],
      filtersSet: {conjunction: 'and', filtersSet: []},
      type: 'select',
      queryType: 'root',
    });
  }

  insertInto<
    TableName extends keyof Omit<
      DB,
      'selectTable' | 'attachmentTable' | 'collaboratorsTable'
    > &
      string
  >(into: TableName): InsertQueryBuilder<DB, TableName> {
    return new InsertQueryBuilder<DB, TableName>({
      tableName: into,
      createdRecords: [],
      returning: [],
      type: 'create',
    });
  }

  update<
    TableName extends keyof Omit<
      DB,
      'selectTable' | 'attachmentTable' | 'collaboratorsTable'
    > &
      string
  >(tableName: TableName): UpdateQueryBuilder<DB, TableName> {
    return new UpdateQueryBuilder<DB, TableName>({
      tableName: tableName,
      values: {},
      filtersSet: {conjunction: 'and', filtersSet: []},
      type: 'update',
    });
  }

  deleteFrom<
    TableName extends keyof Omit<
      DB,
      'selectTable' | 'attachmentTable' | 'collaboratorsTable'
    > &
      string
  >(tableName: TableName): DeleteQueryBuilder<DB, TableName> {
    return new DeleteQueryBuilder<DB, TableName>({
      tableName: tableName,
      deletedRecordIds: [],
      filtersSet: {conjunction: 'and', filtersSet: []},
      type: 'delete',
    });
  }

  batch(
    builders: AnyQueryBuilder[]
  ): BatchQueryBuilder {
    return new BatchQueryBuilder(builders);
  }
}

export function createQueryBuilder<DB extends AnyDB>() {
  return new RootQueryBuilder<DB>();
}
