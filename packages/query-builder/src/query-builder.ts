import { Attachment, FieldWithDirection } from '@taylordb/shared';
import { z } from 'zod';
import { AggregateNode } from './@types/aggregate.js';
import {
  AbstractLinkColumn,
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
import {
  AnyQueryBuilder,
  AreAllBuildersSubscribable,
  BatchQueryBuilder,
} from './batch-query-builder.js';
import { DeleteQueryBuilder } from './delete-query-builder.js';
import { Executor } from './executor.js';
import { InsertQueryBuilder } from './insert-query-builder.js';
import { PluginBuilder } from './plugin-action-builder.js';
import { SelectionBuilder } from './selection-builder.js';
import { UpdateQueryBuilder } from './update-query-builder.js';
import { FilterableQueryBuilder } from './where-query-builder.js';

const MEDIA_UPLOADER_HOST = 'https://media.taylordb.ai';
const MEDIA_UPLOAD_PATH = '/collections/default/files';

/**
 * The main query builder class for constructing and executing select queries.
 * @template DB - The database type.
 * @template TableName - The name of the table to query.
 * @template Selection - The type of the selected fields.
 * @template LinkName - The name of the link field if this is a subquery.
 */
export class QueryBuilder<
  DB extends AnyDB,
  TableName extends keyof DB,
  Selection = object,
  LinkName = null,
> extends FilterableQueryBuilder<DB, TableName> {
  declare _node: QueryNode;

  constructor(node: QueryNode, executor: Executor) {
    super(node, executor);
    this._node = {
      ...node,
      pagination: { ...node.pagination },
    };
  }

  /**
   * Counts the number of records that match the query.
   * @returns A promise that resolves with the total number of records.
   *
   * @example
   * ```typescript
   * const totalUsers = await qb
   *  .selectFrom('users')
   *  .where('age', '>', 30)
   *  .count();
   * ```
   */
  async count(): Promise<number> {
    if (!this.isRootQueryNode(this._node)) {
      throw new Error('count() can only be used on a root query.');
    }
    const query = 'mutation ($metadata: JSON) { execute(metadata: $metadata) }';

    const metadata = {
      type: 'pagination',
      tableName: this._node.tableName,
      ...(this._node.filtersSet.filtersSet.length > 0
        ? { filtersSet: this._node.filtersSet }
        : {}),
      ...(this._node.pagination ? { pagination: this._node.pagination } : {}),
      ...(this._node.sorting ? { sorting: this._node.sorting } : {}),
    };

    const response = await this._executor.rawRequest<{ total: number }[]>(
      query,
      {
        metadata: [metadata],
      },
    );
    return response[0].total;
  }

  /**
   * Selects a set of fields from the table.
   * @param fields - An array of field names to select.
   * @returns A new `QueryBuilder` instance with the specified fields selected.
   *
   * @example
   * ```typescript
   * const users = await qb
   *   .selectFrom('users')
   *   .select(['id', 'name'])
   *   .execute();
   * ```
   */
  select<const TFields extends readonly NonLinkColumnNames<DB[TableName]>[]>(
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

  /**
   * Selects all fields from the table.
   * @returns A new `QueryBuilder` instance with all fields selected.
   *
   * @example
   * ```typescript
   * const users = await qb
   *   .selectFrom('users')
   *   .selectAll()
   *   .execute();
   * ```
   */
  selectAll(): QueryBuilder<
    DB,
    TableName,
    Selection & {
      [K in keyof DB[TableName]]: InferDataType<DB[TableName][K]>;
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

  /**
   * Includes related records from a linked table.
   * This method has two overloads:
   * 1. Pass an array of link field names to include all fields from the related records.
   * 2. Pass an object to specify subqueries for each link field.
   *
   * @param relations - The relations to include.
   * @returns A new `QueryBuilder` instance with the specified relations included.
   *
   * @example
   * ```typescript
   * const usersWithPosts = await qb
   *   .selectFrom('users')
   *   .select(['id', 'name'])
   *   .with(['posts']) // Assuming 'posts' is a link field on the 'users' table
   *   .execute();
   * ```
   *
   * @example
   * ```typescript
   * const usersWithPublishedPosts = await qb
   *   .selectFrom('users')
   *   .select(['id', 'name'])
   *   .with({
   *     posts: (qb) => qb.select(['title', 'content']).where('isPublished', '=', true),
   *   })
   *   .execute();
   * ```
   */
  with<
    const TArg extends
      | (LinkColumnNames<DB[TableName]> & string)
      | readonly (LinkColumnNames<DB[TableName]> & string)[],
  >(
    relations: TArg,
  ): QueryBuilder<
    DB,
    TableName,
    ResolveWithPlain<DB, TableName, TArg, Selection>
  >;
  with<
    const TArg extends {
      [K in LinkColumnNames<DB[TableName]>]?: (
        qb: QueryBuilder<
          DB,
          DB[TableName][K] extends AbstractLinkColumn
            ? DB[TableName][K]['linkedTo']
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
      | (LinkColumnNames<DB[TableName]> & string)
      | (LinkColumnNames<DB[TableName]> & string)[]
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

  /**
   * Sets the maximum number of records to return.
   * @param count - The maximum number of records.
   * @returns A new `QueryBuilder` instance with the limit applied.
   *
   * @example
   * ```typescript
   * const users = await qb
   *   .selectFrom('users')
   *   .select(['id', 'name'])
   *   .limit(10)
   *   .execute();
   * ```
   */
  limit(count: number): QueryBuilder<DB, TableName, Selection, LinkName> {
    return new QueryBuilder(
      {
        ...this._node,
        pagination: { ...this._node.pagination, limit: count },
      },
      this._executor,
    );
  }

  /**
   * Sets the number of records to skip.
   * @param count - The number of records to skip.
   * @returns A new `QueryBuilder` instance with the offset applied.
   *
   * @example
   * ```typescript
   * const users = await qb
   *   .selectFrom('users')
   *   .select(['id', 'name'])
   *   .offset(10)
   *   .execute();
   * ```
   */
  offset(count: number): QueryBuilder<DB, TableName, Selection, LinkName> {
    return new QueryBuilder(
      {
        ...this._node,
        pagination: { ...this._node.pagination, offset: count },
      },
      this._executor,
    );
  }

  /**
   * Paginates the results.
   * @param page - The page number to retrieve.
   * @param limit - The number of records per page.
   * @returns A new `QueryBuilder` instance with pagination applied.
   *
   * @example
   * ```typescript
   * const users = await qb
   *   .selectFrom('users')
   *   .select(['id', 'name'])
   *   .paginate(2, 25) // Retrieves page 2 with 25 records per page
   *   .execute();
   * ```
   */
  paginate(
    page: number,
    limit: number,
  ): QueryBuilder<DB, TableName, Selection, LinkName> {
    return this.offset((page - 1) * limit).limit(limit);
  }

  /**
   * Sorts the results by a specified field.
   * @param field - The field to sort by.
   * @param direction - The sort direction ('asc' or 'desc').
   * @returns A new `QueryBuilder` instance with the sorting applied.
   *
   * @example
   * ```typescript
   * const users = await qb
   *   .selectFrom('users')
   *   .select(['id', 'name'])
   *   .orderBy('name', 'asc')
   *   .execute();
   * ```
   */
  orderBy(
    field: keyof DB[TableName],
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

  /**
   * Executes the select query.
   * @returns A promise that resolves with an array of the selected records.
   *
   * @example
   * ```typescript
   * const users = await qb
   *   .selectFrom('users')
   *   .select(['id', 'name'])
   *   .execute();
   * ```
   */
  async execute(): Promise<Selection[]> {
    const response = await this._executor.execute<Selection>(this);

    return this._transformResponse(response[0]);
  }

  /**
   * Executes the select query and returns the first result.
   * @returns A promise that resolves with the first record, or `null` if no records were found.
   *
   * @example
   * ```typescript
   * const user = await qb
   *   .selectFrom('users')
   *   .where('id', '=', 1)
   *   .select(['id', 'name'])
   *   .executeTakeFirst();
   * ```
   */
  async executeTakeFirst(): Promise<Selection | null> {
    const response = await this._executor.execute<Selection[]>(this);

    const first = response[0]?.[0] ?? null;
    if (first === null) return null;

    const transformed = this._transformResponse([first]);
    return transformed[0] ?? null;
  }

  /**
   * Transforms the response by converting attachment objects to absolute URL strings.
   * @private
   */
  private _transformResponse(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this._transformResponse(item));
    }

    if (typeof data === 'string' && data.startsWith('files/')) {
      return `${MEDIA_UPLOADER_HOST}/${data}`;
    }

    if (data && typeof data === 'object') {
      const transformed: any = {};
      for (const [key, value] of Object.entries(data)) {
        transformed[key] = this._transformResponse(value);
      }
      return transformed;
    }

    return data;
  }

  subscribe(callback: (result: Selection[]) => void) {
    return this._executor.subscribe([this], callback);
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
        ...(this._node.pagination &&
        Object.keys(this._node.pagination).length > 0
          ? { pagination: this._node.pagination }
          : {}),
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
        ...(this._node.pagination &&
        Object.keys(this._node.pagination).length > 0
          ? { pagination: this._node.pagination }
          : {}),
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

/**
 * The root query builder class that provides entry points for all query types.
 */
export type ReadBlacklistTable = 'attachmentTable';
export type MutationBlacklistTable = 'attachmentTable' | 'collaborators';

export class BaseRootQueryBuilder<DB extends AnyDB> {
  protected _executor: Executor;

  constructor(executor: Executor) {
    this._executor = executor;
  }

  private validateCanRead(tableName: string) {
    if (tableName === 'attachmentTable') {
      throw new Error(`Cannot read from ${tableName}`);
    }
  }

  private validateCanMutate(tableName: string) {
    const blacklist = ['attachmentTable', 'collaborators'];

    if (blacklist.includes(tableName)) {
      throw new Error(`Cannot mutate ${tableName}`);
    }
  }

  /**
   * Creates a new select query builder for the specified table.
   * @param from - The name of the table to select from.
   * @returns A new `QueryBuilder` instance.
   *
   * @example
   * ```typescript
   * const qb = createQueryBuilder<MyDatabase>({ ... });
   * const userQuery = qb.selectFrom('users');
   * ```
   */
  selectFrom<TableName extends keyof Omit<DB, ReadBlacklistTable> & string>(
    from: TableName,
  ): QueryBuilder<DB, TableName> {
    this.validateCanRead(from);

    const actualTableName =
      from === 'collaborators' ? 'bambooCollaborators' : from;

    const initialFilters = [];

    if (actualTableName === 'bambooCollaborators') {
      initialFilters.push({
        field: 'status',
        operator: '=',
        value: 'ACTIVE',
      });
    }

    return new QueryBuilder<DB, TableName>(
      {
        tableName: actualTableName,
        fields: [],
        filtersSet: { conjunction: 'and', filtersSet: initialFilters },
        type: 'select',
        queryType: 'root',
      },
      this._executor,
    );
  }

  /**
   * Creates a new insert query builder for the specified table.
   * @param into - The name of the table to insert into.
   * @returns A new `InsertQueryBuilder` instance.
   *
   * @example
   * ```typescript
   * const qb = createQueryBuilder<MyDatabase>({ ... });
   * const insertQuery = qb.insertInto('users');
   * ```
   */
  insertInto<TableName extends keyof Omit<DB, MutationBlacklistTable> & string>(
    into: TableName,
  ): InsertQueryBuilder<DB, TableName> {
    this.validateCanMutate(into);
    return new InsertQueryBuilder<DB, TableName>(
      {
        tableName: into,
        createdRecords: [],
        returning: [],
        type: 'create',
      },
      this._executor,
    );
  }

  /**
   * Creates a new update query builder for the specified table.
   * @param tableName - The name of the table to update.
   * @returns A new `UpdateQueryBuilder` instance.
   *
   * @example
   * ```typescript
   * const qb = createQueryBuilder<MyDatabase>({ ... });
   * const updateQuery = qb.update('users');
   * ```
   */
  update<TableName extends keyof Omit<DB, MutationBlacklistTable> & string>(
    tableName: TableName,
  ): UpdateQueryBuilder<DB, TableName> {
    this.validateCanMutate(tableName);
    return new UpdateQueryBuilder<DB, TableName>(
      {
        tableName: tableName,
        values: {},
        filtersSet: { conjunction: 'and', filtersSet: [] },
        type: 'update',
      },
      this._executor,
    );
  }

  /**
   * Creates a builder scoped to a specific plugin for executing plugin actions.
   * @param pluginName - The name of the plugin.
   * @returns A `PluginBuilder` instance.
   *
   * @example
   * ```typescript
   * const qb = createQueryBuilder<MyDatabase>({ ... });
   * const result = await qb.plugin('email').action('send').input({ recordId: 123 }).execute();
   * ```
   */
  plugin<
    PluginName extends DB extends { _plugins: infer P }
      ? keyof P & string
      : string,
  >(pluginName: PluginName): PluginBuilder<DB, PluginName> {
    return new PluginBuilder<DB, PluginName>(pluginName, this._executor);
  }

  /**
   * Creates a new delete query builder for the specified table.
   * @param tableName - The name of the table to delete from.
   * @returns A new `DeleteQueryBuilder` instance.
   *
   * @example
   * ```typescript
   * const qb = createQueryBuilder<MyDatabase>({ ... });
   * const deleteQuery = qb.deleteFrom('users');
   * ```
   */
  deleteFrom<TableName extends keyof Omit<DB, MutationBlacklistTable> & string>(
    tableName: TableName,
  ): DeleteQueryBuilder<DB, TableName> {
    this.validateCanMutate(tableName);

    return new DeleteQueryBuilder<DB, TableName>(
      {
        tableName: tableName,
        deletedRecordIds: [],
        filtersSet: { conjunction: 'and', filtersSet: [] },
        type: 'delete',
      },
      this._executor,
    );
  }

  /**
   * Creates a new batch query builder.
   * @param builders - An array of query builders to execute in a batch.
   * @returns A new `BatchQueryBuilder` instance.
   *
   * @example
   * ```typescript
   * const qb = createQueryBuilder<MyDatabase>({ ... });
   * const batchQuery = qb.batch([
   *   qb.selectFrom('users').select(['id', 'name']),
   *   qb.insertInto('users').values({ name: 'New User' }),
   * ]);
   * const [users, newUser] = await batchQuery.execute();
   * ```
   */
  batch<const TBuilders extends readonly AnyQueryBuilder[]>(
    builders: TBuilders,
  ): AreAllBuildersSubscribable<TBuilders> extends true
    ? BatchQueryBuilder<TBuilders>
    : Omit<BatchQueryBuilder<TBuilders>, 'subscribe'> {
    return new BatchQueryBuilder(builders, this._executor);
  }

  /**
   * Creates a new aggregation query builder for the specified table.
   * @param tableName - The name of the table to aggregate from.
   * @returns A new `AggregationQueryBuilder` instance.
   *
   * @example
   * ```typescript
   * const qb = createQueryBuilder<MyDatabase>({ ... });
   * const aggregateQuery = qb.aggregateFrom('users');
   * ```
   */
  aggregateFrom<TableName extends keyof Omit<DB, ReadBlacklistTable> & string>(
    tableName: TableName,
  ): AggregationQueryBuilder<DB, TableName> {
    this.validateCanRead(tableName);

    const actualTableName =
      tableName === 'collaborators' ? 'bambooCollaborators' : tableName;

    const initialFilters = [];
    if (actualTableName === 'bambooCollaborators') {
      initialFilters.push({
        field: 'status',
        operator: '=',
        value: 'ACTIVE',
      });
    }

    const node: AggregateNode = {
      tableName: actualTableName,
      type: 'aggregation',
      filtersSet: { conjunction: 'and', filtersSet: initialFilters },
      groupings: [],
      aggregations: {},
    };
    return new AggregationQueryBuilder<DB, TableName>(node, this._executor);
  }

  async uploadAttachments(
    files: { file: Blob; name: string }[],
  ): Promise<Attachment[]> {
    const formData = new FormData();
    files.forEach(({ file, name }) => {
      formData.append('files', file, name);
    });

    const response = await fetch(`${MEDIA_UPLOADER_HOST}${MEDIA_UPLOAD_PATH}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this._executor.getApiKey()}`,
        baseId: this._executor.getBaseId(),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Attachment upload failed: ${response.statusText}`);
    }

    const responseData = await response.json();
    return responseData.map((data: any) => new Attachment(data));
  }

  public get auth() {
    return {
      getUser: async () => {
        const userId = await this._executor.getCurrentUserId();

        if (!userId) {
          throw new Error('User ID not available from the connection');
        }

        const query =
          'mutation ($metadata: JSON) { execute(metadata: $metadata) }';

        const userRecord: any = await this._executor.rawRequest(query, {
          metadata: [
            {
              type: 'select',
              tableName: 'bambooCollaborators',
              fields: ['id', 'name', 'emailAddress', 'avatar'],
              filtersSet: {
                conjunction: 'and',
                filtersSet: [
                  {
                    field: 'status',
                    operator: '=',
                    value: 'ACTIVE',
                  },
                  {
                    field: 'externalId',
                    operator: '=',
                    value: userId.toString(),
                  },
                ],
              },
            },
          ],
        });

        const profile = Array.isArray(userRecord) ? userRecord[0][0] : null;

        if (!profile) {
          return null;
        }

        return {
          id: profile.id,
          name: profile.name,
          email: profile.emailAddress,
          avatar: profile.avatar,
        };
      },
    };
  }
}

export class RootQueryBuilder<
  DB extends AnyDB,
> extends BaseRootQueryBuilder<DB> {
  constructor(executor: Executor) {
    super(executor);
  }

  async transaction<T>(
    callback: (qb: BaseRootQueryBuilder<DB>) => Promise<T>,
  ): Promise<T> {
    if (this._executor.isInTransaction) {
      throw new Error('Nested transactions are not supported.');
    }
    const { startTransaction: transactionId } =
      await this._executor.rawRequest<{
        startTransaction: string;
      }>('mutation { startTransaction }', {});

    const transactionalExecutor =
      this._executor.withTransactionId(transactionId);
    const transactionalQb = new BaseRootQueryBuilder<DB>(transactionalExecutor);

    try {
      const result = await callback(transactionalQb);

      await transactionalExecutor.rawRequest(
        'mutation { commitTransaction }',
        {},
      );

      return result;
    } catch (error) {
      await transactionalExecutor.rawRequest(
        'mutation { rollbackTransaction }',
        {},
      );
      throw error;
    }
  }
}

const QBConfigSchema = z.object({
  baseUrl: z.string().url(),
  apiKey: z.string().nonempty(),
});

export function createQueryBuilder<DB extends AnyDB>(config: {
  baseUrl: string;
  baseId: string;
  apiKey: string;
}) {
  QBConfigSchema.parse(config);
  const executor = new Executor(config.baseUrl, config.apiKey, config.baseId);
  return new RootQueryBuilder<DB>(executor);
}
