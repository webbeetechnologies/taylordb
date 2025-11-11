# TaylorDB Query Builder

<img src="docs/media/logo.png" width="200" />

This is the official TypeScript query builder for TaylorDB. It provides a type-safe and intuitive API for building and executing queries against your TaylorDB database.

## Features

- **Type-Safe Queries**: Leverage your database schema to get full type safety and autocompletion for your queries.
- **Fluent API**: Chain methods together to build complex queries with ease.
- **CRUD Operations**: Full support for `select`, `insert`, `update`, and `delete` operations.
- **Advanced Filtering**: Filter your data with a rich set of operators and logical conjunctions.
- **Pagination and Sorting**: Easily paginate and sort your query results.
- **Batch Queries**: Execute multiple queries in a single request for improved performance.
- **Aggregation Queries**: Perform powerful aggregation queries with grouping and aggregate functions.

## Installation

```bash
npm install @taylordb/query-builder
```

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

```typescript
const updatedCustomer = await qb
  .update('customers')
  .set({ lastName: 'Smith' })
  .where('id', '=', 1)
  .execute();
```

### Deleting Data

```typescript
const result = await qb.deleteFrom('customers').where('id', '=', 1).execute();
```
