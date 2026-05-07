# Pagination

Three methods control how many records are returned and from where in the result set.

## `.limit(count)`

Sets the maximum number of records to return.

```ts
const users = await qb
  .selectFrom('users')
  .selectAll()
  .limit(20)
  .execute();
```

## `.offset(count)`

Skips the first `count` records before returning results.

```ts
const users = await qb
  .selectFrom('users')
  .selectAll()
  .offset(40)
  .execute();
```

## `.paginate(page, limit)`

Convenience wrapper around `.offset()` and `.limit()`. Pages are 1-indexed.

```ts
.paginate(page, limit)
// equivalent to .offset((page - 1) * limit).limit(limit)
```

```ts
const page3 = await qb
  .selectFrom('users')
  .selectAll()
  .orderBy('name', 'asc')
  .paginate(3, 25)  // rows 51–75
  .execute();
```

## `.count()`

Returns the total number of records that match the current filters, ignoring `.limit()` and `.offset()`. Use this to calculate total pages.

```ts
const total = await qb
  .selectFrom('users')
  .where('role', '=', 'admin')
  .count();

const totalPages = Math.ceil(total / pageSize);
```

`count()` can only be called on a root `selectFrom` query, not on a sub-query inside `.with()`.

## Pagination on sub-queries

`.limit()` and `.offset()` are available inside the `.with()` object form to limit how many related records are returned per parent record.

```ts
const users = await qb
  .selectFrom('users')
  .select(['id', 'name'])
  .with({
    posts: qb => qb.select(['id', 'title']).limit(3),
  })
  .execute();
// at most 3 posts per user
```

## Pagination on aggregation queries

All three methods — `.limit()`, `.offset()`, `.paginate()` — are available on `AggregationQueryBuilder` as well.

```ts
const stats = await qb
  .aggregateFrom('orders')
  .groupBy('status')
  .metrics({ total: count('id') })
  .paginate(1, 10)
  .execute();
```
