<div align="center">
  <img src="docs/media/logo.png" width="200" alt="TaylorDB Logo" />
</div>

# TaylorDB Query Builder

The official TypeScript query builder for TaylorDB. It provides a type-safe, fluent, and intuitive API for building and executing queries against your TaylorDB database.

## Features

- **Type-Safe Queries**: Leverage your database schema for full type safety and autocompletion, catching errors at compile-time.
- **Fluent API**: A clean, chainable interface for building complex queries with ease.
- **Full CRUD Support**: Complete implementation for `select`, `insert`, `update`, and `delete` operations.
- **Advanced Filtering**: Filter data with a rich set of operators, nested conditions, and cross-table filters on relations.
- **Complex Selections**: Fetch related data using `with`, select specific columns, or get all columns with `selectAll`.
- **Pagination and Sorting**: Easily paginate and sort your query results.
- **Aggregation Queries**: Perform powerful aggregations with grouping and a variety of aggregate functions.
- **Batch Operations**: Execute multiple queries in a single, efficient request.
- **Real-time Subscriptions**: Subscribe to queries and receive live updates when data changes.

## Installation

```bash
npm install @taylordb/query-builder
```

## Getting Started

### 1. Generate TypeScript Types

First, you need to generate a `taylor.types.ts` file from your TaylorDB schema using the CLI. This file will contain the TypeScript definitions for your database schema, enabling the query builder's type-safety features.

```bash
npx @taylordb/cli generate-schema
```

### 2. Create a Query Builder Instance

Once you have your types file, you can create a new query builder instance.

```typescript
import { createQueryBuilder } from '@taylordb/query-builder';
import { TaylorDatabase } from './taylor.types'; // Import the generated types

const qb = createQueryBuilder<TaylorDatabase>({
  baseUrl: 'YOUR_TAYLORDB_BASE_URL',
  apiKey: 'YOUR_TAYLORDB_API_KEY',
});
```

## Usage

### Select Queries

#### Basic Select

Select specific columns from a table.

```typescript
const customers = await qb
  .selectFrom('customers')
  .select(['firstName', 'lastName', 'email'])
  .execute();

// Access the data
customers.forEach(customer => {
  console.log(customer.firstName, customer.lastName, customer.email);
});
```

Use `selectAll()` to fetch all columns.

```typescript
const allCustomerData = await qb
  .selectFrom('customers')
  .selectAll()
  .execute();

// Access all fields from the record
allCustomerData.forEach(customer => {
  console.log(customer.id, customer.firstName, customer.createdAt);
});
```

#### Filtering

Use `where` and `orWhere` to filter your results.

```typescript
const johns = await qb
  .selectFrom('users')
  .select(['name', 'email'])
  .where('name', '=', 'John Doe')
  .orWhere('email', '=', 'john.doe@example.com')
  .execute();

// Process filtered results
johns.forEach(user => {
  console.log(`Found: ${user.name} (${user.email})`);
});
```

You can also nest `where` clauses for complex logic.

```typescript
const users = await qb
  .selectFrom('users')
  .where(qb =>
    qb.where('role', '=', 'admin').orWhere('lastActive', '>', '2023-01-01')
  )
  .execute();

// Access the filtered data
users.forEach(user => {
  // user has all selected fields available
  console.log(user.name, user.email);
});
```

#### Fetching Relations

Include related records from linked tables using `with`.

```typescript
// Get users and all fields from their related posts
const usersWithPosts = await qb
  .selectFrom('users')
  .select(['id', 'name'])
  .with(['posts'])
  .execute();

// Access nested relation data
usersWithPosts.forEach(user => {
  console.log(`${user.name} has ${user.posts.length} posts`);
  user.posts.forEach(post => {
    console.log(`  - ${post.title}`);
  });
});
```

You can also provide a function to customize the subquery for the relation.

```typescript
// Get users and only the title of their published posts
const usersWithPublishedPosts = await qb
  .selectFrom('users')
  .select(['id', 'name'])
  .with({
    posts: (qb) => qb.select(['title']).where('isPublished', '=', true),
  })
  .execute();

// Access filtered relation data
usersWithPublishedPosts.forEach(user => {
  console.log(`${user.name}'s published posts:`);
  user.posts.forEach(post => {
    console.log(`  - ${post.title}`);
  });
});
```

#### Cross-Table Filtering

Filter records based on conditions in a related table.

```typescript
// Get users who have at least one published post
const usersWithPublishedPosts = await qb
  .selectFrom('users')
  .where('posts', 'hasAnyOf', qb => qb.where('isPublished', '=', true))
  .execute();

// Access the filtered users
usersWithPublishedPosts.forEach(user => {
  console.log(`${user.name} has published posts`);
});
```

#### Sorting and Pagination

```typescript
const users = await qb
  .selectFrom('users')
  .select(['id', 'name'])
  .orderBy('name', 'asc')
  .paginate(2, 25) // Page 2, 25 items per page
  .execute();

// Access paginated results
users.forEach((user, index) => {
  console.log(`${index + 1}. ${user.name} (ID: ${user.id})`);
});
```

### Insert Queries

Insert single or multiple records. Use `returning` to get data back from the new records.

```typescript
const newUsers = await qb
  .insertInto('users')
  .values([
    { name: 'John Doe', email: 'john.doe@example.com' },
    { name: 'Jane Doe', email: 'jane.doe@example.com' },
  ])
  .returning(['id', 'name'])
  .execute();

// Access the inserted records
newUsers.forEach(user => {
  console.log(`Created user: ${user.name} with ID: ${user.id}`);
});
```

You can also insert a single record:

```typescript
const newUser = await qb
  .insertInto('users')
  .values({ name: 'John Doe', email: 'john.doe@example.com' })
  .returning(['id', 'name', 'email'])
  .executeTakeFirst();

// Access the single inserted record
if (newUser) {
  console.log(`Created user: ${newUser.name} (${newUser.email})`);
}
```

### Update Queries

Update records matching a `where` clause.

```typescript
const { affectedRecords } = await qb
  .update('users')
  .set({ name: 'New Name' })
  .where('id', '=', 1)
  .execute();

// Access the result
console.log(`Updated ${affectedRecords} record(s)`);
```

### Delete Queries

Delete records matching a `where` clause.

```typescript
const { affectedRecords } = await qb
  .deleteFrom('users')
  .where('id', '=', 1)
  .execute();

// Access the result
console.log(`Deleted ${affectedRecords} record(s)`);
```

### Aggregation Queries

Perform powerful aggregations on your data using the `metrics` API, which returns a flat array structure for easy data access.

```typescript
import { count, avg, sum } from '@taylordb/query-builder';

const userStats = await qb
  .aggregateFrom('users')
  .groupBy('role', 'asc')
  .groupBy('permission', 'desc')
  .metrics({
    idCount: count('id'),
    ageAvg: avg('age'),
    ageSum: sum('age'),
  })
  .execute();

// Access flat aggregation results - much simpler!
userStats.forEach(stat => {
  console.log(`${stat.role} - ${stat.permission}:`);
  console.log(`  Users: ${stat.idCount}`);
  console.log(`  Average Age: ${stat.ageAvg}`);
  console.log(`  Total Age: ${stat.ageSum}`);
});

// Example output structure:
// [
//   { role: "Admin", permission: "EDIT", idCount: 10, ageAvg: 35, ageSum: 350 },
//   { role: "Admin", permission: "READ", idCount: 5, ageAvg: 30, ageSum: 150 },
//   { role: "User", permission: "READ", idCount: 20, ageAvg: 25, ageSum: 500 },
// ]
```

#### Available Aggregation Helpers

```typescript
import { 
  count,    // Count records
  avg,      // Average (maps to 'average')
  sum,      // Sum
  median,   // Median
  min,      // Minimum
  max,      // Maximum
  range,    // Range
  stdDev,   // Standard deviation
  unique,   // Unique count
} from '@taylordb/query-builder';

const stats = await qb
  .aggregateFrom('products')
  .groupBy('category')
  .metrics({
    totalProducts: count('id'),
    avgPrice: avg('price'),
    totalRevenue: sum('price'),
    minPrice: min('price'),
    maxPrice: max('price'),
    priceRange: range('price'),
    uniqueBrands: unique('brand'),
  })
  .execute();

// Access all metrics directly
stats.forEach(category => {
  console.log(`${category.category}:`);
  console.log(`  Products: ${category.totalProducts}`);
  console.log(`  Avg Price: $${category.avgPrice}`);
  console.log(`  Revenue: $${category.totalRevenue}`);
  console.log(`  Price Range: $${category.minPrice} - $${category.maxPrice}`);
  console.log(`  Unique Brands: ${category.uniqueBrands}`);
});
```

#### Aggregations Without Grouping

You can also perform aggregations without grouping to get overall statistics:

```typescript
const overallStats = await qb
  .aggregateFrom('users')
  .metrics({
    totalUsers: count('id'),
    avgAge: avg('age'),
    totalAge: sum('age'),
  })
  .execute();

// Returns a single record (array with one item)
const stats = overallStats[0];
console.log(`Total Users: ${stats.totalUsers}`);
console.log(`Average Age: ${stats.avgAge}`);
console.log(`Total Age: ${stats.totalAge}`);
```

### Batch Queries

Execute multiple queries in a single request for improved performance.

```typescript
const [users, newUser] = await qb.batch([
  qb.selectFrom('users').select(['id', 'name']),
  qb.insertInto('users').values({ name: 'New User' }).returning(['id']),
]).execute();

// Access results from each query
console.log(`Found ${users.length} users`);
if (newUser) {
  console.log(`Created new user with ID: ${newUser.id}`);
}
```

Batch queries are especially useful for complex operations:

```typescript
const [existingUsers, newUsers, stats] = await qb.batch([
  qb.selectFrom('users').where('role', '=', 'admin'),
  qb.insertInto('users').values([
    { name: 'User 1', email: 'user1@example.com' },
    { name: 'User 2', email: 'user2@example.com' },
  ]).returning(['id', 'name']),
  qb.aggregateFrom('users')
    .groupBy('role')
    .metrics({ count: count('id') }),
]).execute();

// Access all results
console.log(`Existing admins: ${existingUsers.length}`);
newUsers.forEach(user => console.log(`Created: ${user.name}`));
stats.forEach(stat => console.log(`${stat.role}: ${stat.count} users`));
```

### Real-time Subscriptions

Subscribe to queries and get real-time updates when data changes.

```typescript
const unsubscribe = qb
  .selectFrom('users')
  .select(['id', 'name'])
  .subscribe((users) => {
    console.log('Users updated:', users.length);
    users.forEach(user => {
      console.log(`  - ${user.name} (ID: ${user.id})`);
    });
  });

// To stop listening for updates
unsubscribe();
```

Subscriptions work with all query types, including aggregations:

```typescript
// Subscribe to aggregation metrics
const unsubscribe = qb
  .aggregateFrom('users')
  .groupBy('role')
  .metrics({
    userCount: count('id'),
    avgAge: avg('age'),
  })
  .subscribe((stats) => {
    console.log('User statistics updated:');
    stats.forEach(stat => {
      console.log(`  ${stat.role}: ${stat.userCount} users, avg age: ${stat.avgAge}`);
    });
  });

// Clean up when done
unsubscribe();
```

## Practical Examples

### Building a Dashboard

Here's a complete example of building a dashboard with multiple data sources:

```typescript
import { createQueryBuilder, count, avg, sum } from '@taylordb/query-builder';

// Fetch dashboard data in parallel
const [recentUsers, userStats, orderStats] = await Promise.all([
  // Get recent users
  qb
    .selectFrom('users')
    .select(['id', 'name', 'email', 'createdAt'])
    .orderBy('createdAt', 'desc')
    .limit(10)
    .execute(),
  
  // Get user statistics by role
  qb
    .aggregateFrom('users')
    .groupBy('role')
    .metrics({
      total: count('id'),
      avgAge: avg('age'),
    })
    .execute(),
  
  // Get order statistics by status
  qb
    .aggregateFrom('orders')
    .groupBy('status')
    .metrics({
      count: count('id'),
      totalRevenue: sum('amount'),
      avgOrderValue: avg('amount'),
    })
    .execute(),
]);

// Display recent users
console.log('Recent Users:');
recentUsers.forEach(user => {
  console.log(`  ${user.name} (${user.email}) - Joined: ${user.createdAt}`);
});

// Display user statistics
console.log('\nUser Statistics by Role:');
userStats.forEach(stat => {
  console.log(`  ${stat.role}: ${stat.total} users, avg age: ${stat.avgAge}`);
});

// Display order statistics
console.log('\nOrder Statistics by Status:');
orderStats.forEach(stat => {
  console.log(`  ${stat.status}:`);
  console.log(`    Orders: ${stat.count}`);
  console.log(`    Revenue: $${stat.totalRevenue}`);
  console.log(`    Avg Order: $${stat.avgOrderValue}`);
});
```

### Filtering and Aggregating Related Data

```typescript
// Get users with their order counts and total spending
const usersWithStats = await qb
  .selectFrom('users')
  .select(['id', 'name', 'email'])
  .with({
    orders: (qb) => qb.select(['id', 'amount', 'status']),
  })
  .execute();

// Calculate statistics in JavaScript
usersWithStats.forEach(user => {
  const totalOrders = user.orders.length;
  const totalSpent = user.orders.reduce((sum, order) => sum + order.amount, 0);
  const completedOrders = user.orders.filter(o => o.status === 'completed').length;
  
  console.log(`${user.name}:`);
  console.log(`  Total Orders: ${totalOrders}`);
  console.log(`  Total Spent: $${totalSpent}`);
  console.log(`  Completed: ${completedOrders}`);
});
```

### Complex Aggregation with Multiple Groupings

```typescript
// Analyze sales performance by region and product category
const salesAnalysis = await qb
  .aggregateFrom('orders')
  .groupBy('region', 'asc')
  .groupBy('category', 'asc')
  .metrics({
    orderCount: count('id'),
    totalRevenue: sum('amount'),
    avgOrderValue: avg('amount'),
    maxOrder: max('amount'),
    minOrder: min('amount'),
  })
  .execute();

// Process the flat results
salesAnalysis.forEach(analysis => {
  console.log(`${analysis.region} - ${analysis.category}:`);
  console.log(`  Orders: ${analysis.orderCount}`);
  console.log(`  Revenue: $${analysis.totalRevenue}`);
  console.log(`  Avg Order: $${analysis.avgOrderValue}`);
  console.log(`  Range: $${analysis.minOrder} - $${analysis.maxOrder}`);
});
```

### Real-time Data Monitoring

```typescript
// Monitor order status changes in real-time
const unsubscribe = qb
  .aggregateFrom('orders')
  .groupBy('status')
  .metrics({
    count: count('id'),
    totalValue: sum('amount'),
  })
  .subscribe((stats) => {
    console.log('\n=== Order Status Update ===');
    stats.forEach(stat => {
      console.log(`${stat.status}: ${stat.count} orders ($${stat.totalValue})`);
    });
  });

// The callback will be triggered whenever order data changes
// Remember to unsubscribe when done
// unsubscribe();
```
