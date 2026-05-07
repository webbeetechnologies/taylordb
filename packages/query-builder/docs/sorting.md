# Sorting

Use `.orderBy()` to control the order of results returned by a select or aggregation query.

## `.orderBy(field, direction?)`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `field` | `keyof Table` | — | The field to sort by. TypeScript will autocomplete valid field names for the table. |
| `direction` | `'asc' \| 'desc'` | `'asc'` | Sort direction. |

```ts
const users = await qb
  .selectFrom('users')
  .select(['id', 'name', 'createdAt'])
  .orderBy('name', 'asc')
  .execute();
```

## Multiple sort fields

Chain `.orderBy()` multiple times. The sorts are applied in the order they are added.

```ts
const users = await qb
  .selectFrom('users')
  .selectAll()
  .orderBy('role', 'asc')
  .orderBy('name', 'asc')
  .execute();
// sorted by role ascending, then by name ascending within each role
```

## With pagination

Sorting composes cleanly with `.limit()`, `.offset()`, and `.paginate()`.

```ts
const page2 = await qb
  .selectFrom('posts')
  .select(['id', 'title', 'createdAt'])
  .orderBy('createdAt', 'desc')
  .paginate(2, 20)
  .execute();
```

## On aggregation queries

`.orderBy()` works the same way on `AggregationQueryBuilder`.

```ts
const stats = await qb
  .aggregateFrom('orders')
  .groupBy('status')
  .metrics({ total: count('id') })
  .orderBy('status', 'asc')
  .execute();
```

## Limitations

- Sorting is only available on root select queries and aggregation queries. It is not available when configuring a sub-query inside `.with({ ... })`.
- You cannot sort by a link field directly. Sort by scalar fields on the table.
