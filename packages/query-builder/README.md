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
const result = await qb
  .deleteFrom('customers')
  .where('id', '=', 1)
  .execute();
```

### Batch Queries

You can execute multiple queries in a single batch request for improved performance. The result will be a tuple that corresponds to the results of each query in the batch.

```typescript
const [customers, newCustomer] = await qb.batch([
  qb.selectFrom('customers').select(['firstName', 'lastName']),
  qb.insertInto('customers').values({ firstName: 'John', lastName: 'Doe' }),
]).execute();
```

### Aggregation Queries

You can perform powerful aggregation queries using the `aggregateFrom` method. You can group by one or more fields and specify aggregate functions to apply.

```typescript
const aggregates = await qb
  .aggregateFrom('customers')
  .groupBy('firstName', 'asc')
  .groupBy('lastName', 'desc')
  .withAggregates({
    id: ['count', 'sum'],
  })
  .execute();
```
