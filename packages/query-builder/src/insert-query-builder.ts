import type { Insertable, InsertNode } from './@types/insert.js';
import type { AnyDB, QueryNode } from './@types/internal-types.js';
import { NonLinkColumnNames } from './@types/query-builder.js';
import { ResolveSelection } from './@types/type-helpers.js';
import { Executor } from './executor.js';
import { FieldsProcessor } from './fields-processor.js';
import { QueryBuilder } from './query-builder.js';
import { SelectionBuilder } from './selection-builder.js';

const fieldsProcessor = new FieldsProcessor();

/**
 * A query builder for creating new records in the database.
 * @template DB - The database type.
 * @template TableName - The name of the table to insert into.
 * @template Selection - The type of the selected fields.
 */
export class InsertQueryBuilder<
  DB extends AnyDB,
  TableName extends keyof DB,
  Selection = { id: number },
> {
  #node: InsertNode;
  #executor: Executor;

  constructor(node: InsertNode, executor: Executor) {
    this.#node = node;
    this.#executor = executor;
  }

  /**
   * The values to insert into the table.
   * @param values - An object or array of objects representing the records to create.
   * @returns The `InsertQueryBuilder` instance for chaining.
   *
   * @example Single Record Insertion
   * ```typescript
   * const newUser = await qb
   *   .insertInto('users')
   *   .values({ name: 'John Doe', email: 'john.doe@example.com' })
   *   .executeTakeFirst();
   * ```
   *
   * @example Multiple Record Insertion
   * ```typescript
   * const newUsers = await qb
   *   .insertInto('users')
   *   .values([{ name: 'John Doe' }, { name: 'Jane Doe' }])
   *   .execute();
   * ```
   */
  values(
    values: Insertable<DB[TableName]> | Insertable<DB[TableName]>[],
  ): InsertQueryBuilder<DB, TableName, Selection> {
    const records = Array.isArray(values) ? values : [values];
    const createdRecords = records.map(record =>
      fieldsProcessor.process(record),
    );

    return new InsertQueryBuilder(
      {
        ...this.#node,
        createdRecords,
      },
      this.#executor,
    );
  }

  /**
   * The fields to return after the insert operation.
   * @param fields - An array of field names to return.
   * @returns The `InsertQueryBuilder` instance for chaining.
   *
   * @example
   * ```typescript
   * const newUser = await qb
   *   .insertInto('users')
   *   .values({ name: 'John Doe' })
   *   .returning(['id', 'name'])
   *   .executeTakeFirst();
   * ```
   */
  returning<const TFields extends readonly NonLinkColumnNames<DB[TableName]>[]>(
    fields: TFields,
  ): InsertQueryBuilder<
    DB,
    TableName,
    ResolveSelection<DB, TableName, TFields, object>
  > {
    const newSelects = fields.map(field => {
      if (typeof field === 'function') {
        const builder = new SelectionBuilder<DB, TableName>(this.#executor);
        // @ts-ignore
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
      this.#executor,
    );
  }

  /**
   * Executes the insert query.
   * @returns A promise that resolves with an array of the selected fields from the inserted records.
   *
   * @example
   * ```typescript
   * const newUsers = await qb
   *   .insertInto('users')
   *   .values([{ name: 'John Doe' }, { name: 'Jane Doe' }])
   *   .returning(['id', 'name'])
   *   .execute();
   * ```
   */
  async execute(): Promise<Selection[]> {
    return (await this.#executor.execute(this))[0];
  }

  /**
   * Executes the insert query and returns the first result.
   * @returns A promise that resolves with the first inserted record, or `null` if no records were inserted.
   *
   * @example
   * ```typescript
   * const newUser = await qb
   *   .insertInto('users')
   *   .values({ name: 'John Doe' })
   *   .returning(['id', 'name'])
   *   .executeTakeFirst();
   * ```
   */
  async executeTakeFirst(): Promise<Selection | null> {
    const response = await this.execute();
    return response[0] ?? null;
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

  _prepareMetadata(): any {
    const buildSelects = (selects: (string | QueryNode)[]): any[] => {
      return selects.map(field => {
        if (typeof field === 'string') {
          return field;
        }
        const subQueryBuilder = new QueryBuilder(
          field as QueryNode,
          this.#executor,
        );
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
