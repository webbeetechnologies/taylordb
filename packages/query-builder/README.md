# @taylordb/query-builder

<img src="../../docs/media/logo.png" width="200" />

This package contains the official TypeScript query builder for TaylorDB. It provides a type-safe and intuitive API for building and executing queries against your TaylorDB database.

## Features

- **Type-Safe Queries**: Leverage your database schema to get full type safety and autocompletion for your queries.
- **Fluent API**: Chain methods together to build complex queries with ease.
- **CRUD Operations**: Full support for `select`, `insert`, `update`, and `delete` operations.
- **Advanced Filtering**: Filter your data with a rich set of operators and logical conjunctions.
- **Pagination and Sorting**: Easily paginate and sort your query results.
- **Batch Queries**: Execute multiple queries in a single request for improved performance.
- **Aggregation Queries**: Perform powerful aggregation queries with grouping and aggregate functions.
- **Transaction Support**: Execute multiple operations in a single atomic transaction.
- **Attachment Uploads**: Upload files and link them to your records.

## Getting Started

First, you'll need to generate a `taylorclient.types.ts` file from your TaylorDB schema. You can do this using the TaylorDB CLI:

```bash
npx @taylordb/cli generate-schema
```

Once you have your types file, you can create a new query builder instance:

```typescript
import { createQueryBuilder } from '@taylordb/query-builder';
import { TaylorDatabase } from './taylorclient.types';

const qb = createQueryBuilder<TaylorDatabase>({
  baseUrl: 'YOUR_TAYLORDB_BASE_URL',
  apiKey: 'YOUR_TAYLORDB_API_KEY',
});
```

## Usage

### Selecting Data

You can select data from a table using the `selectFrom` method. You can specify which fields to return, and you can filter, sort, and paginate the results.

```typescript
const customers = await qb
  .selectFrom('customers')
  .select(['firstName', 'lastName'])
  .where('firstName', '=', 'John')
  .orderBy('lastName', 'asc')
  .paginate(1, 10)
  .execute();
```

### Inserting Data

You can insert data into a table using the `insertInto` method.

```typescript
const newCustomer = await qb
  .insertInto('customers')
  .values({
    firstName: 'Jane',
    lastName: 'Doe',
  })
  .execute();
```

### Updating Data

You can update data in a table using the `update` method.

```typescript
const updatedCustomer = await qb
  .update('customers')
  .set({ lastName: 'Smith' })
  .where('id', '=', 1)
  .execute();
```

### Deleting Data

You can delete data from a table using the `deleteFrom` method.

```typescript
const result = await qb.deleteFrom('customers').where('id', '=', 1).execute();
```

### Transactions

You can execute a series of operations within a single atomic transaction. If any operation within the transaction fails, all previous operations will be rolled back.

```typescript
const newCustomer = await qb.transaction(async tx => {
  const customer = await tx
    .insertInto('customers')
    .values({
      firstName: 'John',
      lastName: 'Doe',
    })
    .executeTakeFirst();

  if (!customer) {
    throw new Error('Customer creation failed.');
  }

  await tx
    .insertInto('orders')
    .values({
      customerId: customer.id,
      orderDate: new Date().toISOString(),
      total: 100,
    })
    .execute();

  return customer;
});
```

### Handling Attachments

You can upload files and associate them with your records using the `uploadAttachments` method. This is useful for handling things like user avatars, product images, or any other file-based data.

First, upload the file(s) to get `Attachment` instances:

```typescript
const filesToUpload = [
  { file: new Blob(['file content']), name: 'avatar.png' },
];
const attachments = await qb.uploadAttachments(filesToUpload);
```

Then, you can use the returned `Attachment` instances when creating or updating records. The query builder will automatically convert them into the correct format.

```typescript
// Create a new customer with an avatar
const newCustomer = await qb
  .insertInto('customers')
  .values({
    firstName: 'Jane',
    lastName: 'Doe',
    avatar: attachments[0], // Use the Attachment instance
  })
  .executeTakeFirst();

// Update an existing customer's avatar
const { affectedRecords } = await qb
  .update('customers')
  .set({
    avatar: attachments[0], // Use the Attachment instance
  })
  .where('id', '=', 1)
  .execute();
```

### Batch Queries

You can execute multiple queries in a single batch request for improved performance. The result will be a tuple that corresponds to the results of each query in the batch.

```typescript
const [customers, newCustomer] = await qb
  .batch([
    qb.selectFrom('customers').select(['firstName', 'lastName']),
    qb.insertInto('customers').values({ firstName: 'John', lastName: 'Doe' }),
  ])
  .execute();
```

### Aggregation Queries

You can perform powerful aggregation queries using the `aggregateFrom` method. You can group by one or more fields and specify aggregate functions to apply.

```typescript
import { count, sum } from '@taylordb/query-builder';

const aggregates = await qb
  .aggregateFrom('customers')
  .groupBy('firstName', 'asc')
  .groupBy('lastName', 'desc')
  .metrics({
    idCount: count('id'),
    idSum: sum('id'),
  })
  .execute();
```

## Recipes

### Select with Relations

You can use the `with` method to fetch related records from a linked table.

```typescript
// Assuming 'customers' has a link field 'orders' to the 'orders' table
const customersWithOrders = await qb
  .selectFrom('customers')
  .select(['firstName', 'lastName'])
  .with({
    orders: qb => qb.select(['orderDate', 'total']),
  })
  .execute();
```

### Cross-Filters

You can filter records in one table based on the values in a linked table.

```typescript
// Get all customers who have placed an order with a total greater than 100
const highValueCustomers = await qb
  .selectFrom('customers')
  .where('orders', 'hasAnyOf', qb => qb.where('total', '>', 100))
  .execute();
```

### Conditional Updates

You can use `where` clauses to update only the records that match a specific condition.

```typescript
// Update the status of all orders placed before a certain date
const { affectedRecords } = await qb
  .update('orders')
  .set({ status: 'archived' })
  .where('orderDate', '<', '2023-01-01')
  .execute();
```
