import { createQueryBuilder } from '../index.js';
import { TaylorDatabase } from './taylorclient.types.js';

describe('QueryBuilder', () => {
  // @ts-ignore
  const qb = createQueryBuilder<TaylorDatabase>({
    baseUrl: 'http://localhost',
    apiKey: 'test',
  });

  it('should compile a select query', () => {
    const { variables } = qb
      .selectFrom('customers')
      .select(['firstName', 'lastName'])
      .where('firstName', '=', 'John')
      .orderBy('lastName', 'asc')
      .paginate(1, 10)
      .compile();

    expect(variables.metadata[0]).toMatchObject({
      type: 'select',
      tableName: 'customers',
      fields: ['firstName', 'lastName'],
      filtersSet: {
        conjunction: 'and',
        filtersSet: [
          {
            field: 'firstName',
            operator: '=',
            value: 'John',
          },
        ],
      },
      sorting: [{ field: 'lastName', direction: 'asc' }],
      pagination: { offset: 0, limit: 10 },
    });
  });

  it('should compile an insert query', () => {
    const { variables } = qb
      .insertInto('customers')
      .values({
        firstName: 'Jane',
        lastName: 'Doe',
      })
      .compile();

    expect(variables.metadata[0]).toMatchObject({
      type: 'create',
      tableName: 'customers',
      createdRecords: [{ firstName: 'Jane', lastName: 'Doe' }],
    });
  });

  it('should compile an update query', () => {
    const { variables } = qb
      .update('customers')
      .set({ lastName: 'Smith' })
      .where('id', '=', 1)
      .compile();

    expect(variables.metadata[0]).toMatchObject({
      type: 'update',
      tableName: 'customers',
      values: { lastName: 'Smith' },
      filtersSet: {
        conjunction: 'and',
        filtersSet: [
          {
            field: 'id',
            operator: '=',
            value: 1,
          },
        ],
      },
    });
  });

  it('should compile a delete query', () => {
    const { variables } = qb
      .deleteFrom('customers')
      .where('id', '=', 1)
      .compile();

    expect(variables.metadata[0]).toMatchObject({
      type: 'delete',
      tableName: 'customers',
      filtersSet: {
        conjunction: 'and',
        filtersSet: [
          {
            field: 'id',
            operator: '=',
            value: 1,
          },
        ],
      },
    });
  });

  it('should compile a batch query', () => {
    const { variables } = qb
      .batch([
        qb.selectFrom('customers').select(['firstName', 'lastName']),
        qb
          .insertInto('customers')
          .values({ firstName: 'John', lastName: 'Doe' }),
      ])
      .compile();

    expect(variables.metadata).toHaveLength(2);
    expect(variables.metadata[0]).toMatchObject({
      type: 'select',
      tableName: 'customers',
    });
    expect(variables.metadata[1]).toMatchObject({
      type: 'create',
      tableName: 'customers',
    });
  });

  it('should compile an aggregate query', () => {
    const { variables } = qb
      .aggregateFrom('customers')
      .groupBy('firstName', 'asc')
      .withAggregates({
        id: ['sum'],
      })
      .compile();

    expect(variables.metadata[0]).toMatchObject({
      type: 'aggregation',
      tableName: 'customers',
      groupings: [{ field: 'firstName', direction: 'asc' }],
      aggregations: {
        id: ['sum'],
      },
    });
  });
});
