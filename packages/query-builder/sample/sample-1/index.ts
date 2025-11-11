import { createQueryBuilder } from '../../src/query-builder.js';
import { TaylorDatabase } from './taylorclient.types.js';

async function main() {
  const qb = createQueryBuilder<TaylorDatabase>({
    baseUrl: process.env.TAYLORDB_BASE_URL!,
    apiKey: process.env.TAYLORDB_API_KEY!,
  });

  // Example 1: Selecting data with filtering, sorting, and pagination
  console.log('--- Selecting Customers ---');
  const customers = await qb
    .selectFrom('customers')
    .select(['firstName', 'lastName'])
    .where('firstName', 'contains', 'J')
    .orderBy('lastName', 'asc')
    .paginate(1, 10)
    .execute();
  console.log(customers);

  // Example 2: Inserting a new customer
  console.log('\n--- Inserting a Customer ---');
  const newCustomer = await qb
    .insertInto('customers')
    .values({
      firstName: 'John',
      lastName: 'Doe',
    })
    .execute();
  console.log(newCustomer);

  // Example 3: Updating a customer
  console.log('\n--- Updating a Customer ---');
  const updatedCustomer = await qb
    .update('customers')
    .set({ lastName: 'Smith' })
    .where('id', '=', newCustomer[0].id)
    .execute();
  console.log(updatedCustomer);

  // Example 4: Deleting a customer
  console.log('\n--- Deleting a Customer ---');
  const deleteResult = await qb
    .deleteFrom('customers')
    .where('id', '=', newCustomer[0].id)
    .execute();
  console.log(deleteResult);

  // Example 5: Batching queries
  console.log('\n--- Batching Queries ---');
  const batchResult = await qb
    .batch([
      qb
        .insertInto('customers')
        .values({ firstName: 'Batch', lastName: 'User' })
        .returning(['firstName', 'id']),
      qb
        .update('customers')
        .set({ lastName: 'Batch User' })
        .where('id', '=', 1),
      qb
        .aggregateFrom('customers')
        .groupBy('firstName', 'asc')
        .groupBy('lastName', 'desc')
        .withAggregates({
          id: ['sum', 'empty'],
          updatedAt: ['daysRange'],
        }),
      qb.selectFrom('customers').select(['firstName', 'lastName']),
    ])
    .execute();

  // Example 6: Aggregation query
  console.log('\n--- Aggregation Query ---');
  const aggregates = await qb
    .aggregateFrom('customers')
    .groupBy('firstName', 'asc')
    .groupBy('lastName', 'desc')
    .withAggregates({
      id: ['sum', 'empty'],
      updatedAt: ['daysRange'],
    })
    .execute();
  console.log(JSON.stringify(aggregates, null, 2));
}

main().catch(console.error);
