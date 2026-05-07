# Relationships (Loading Linked Records)

Use `.with()` to load related records through link fields. It is available on `selectFrom` queries.

## What can be loaded

Only fields typed as `LinkColumnType` can be used with `.with()`. These are the fields the CLI generates when a TaylorDB field is of type `link`, `collaborators`, or `modifiedBy`.

Fields that use `AttachmentColumnType` are **not** loaded via `.with()` — attachment URLs are resolved automatically when the attachment field is included in `.select()` or `.selectAll()`.

## Simple form — load all fields

Pass a relation name as a string or an array of relation names. All fields of the linked table are fetched.

```ts
const users = await qb
  .selectFrom('users')
  .select(['id', 'name'])
  .with('posts')
  .execute();
// each user: { id, name, posts: Array<{ id, title, ... all post fields }> }
```

Multiple relations at once:

```ts
.with(['posts', 'team'])
```

## Object form — configure the sub-query

Pass an object where each key is a relation name and the value is a callback that receives a `QueryBuilder` scoped to the linked table. You can call `.select()`, `.where()`, `.orderBy()`, `.limit()`, `.offset()`, and further `.with()` on the sub-builder.

```ts
const users = await qb
  .selectFrom('users')
  .select(['id', 'name'])
  .with({
    posts: qb =>
      qb
        .select(['id', 'title', 'createdAt'])
        .where('isPublished', '=', true)
        .orderBy('createdAt', 'desc')
        .limit(5),
  })
  .execute();
// each user: { id, name, posts: Array<{ id, title, createdAt }> }
// only published posts, newest first, max 5 per user
```

## Nested relationships

You can nest `.with()` inside a sub-query to load relationships of related records.

```ts
const users = await qb
  .selectFrom('users')
  .select(['id', 'name'])
  .with({
    posts: qb =>
      qb
        .select(['id', 'title'])
        .with({
          comments: cqb => cqb.select(['id', 'body']),
        }),
  })
  .execute();
```

## What cannot be loaded

- **Attachment fields** (`AttachmentColumnType`) are not relationship fields and cannot be used with `.with()`. Select them directly — their URLs are resolved automatically.
- **Aggregated counts** of related records are not supported through `.with()`. Use `aggregateFrom` with a cross-table filter for that instead.
- **`returning()` on insert** does not support loading relationships. Perform a follow-up `selectFrom` query if you need related data after an insert.
- **`update` and `deleteFrom`** do not support `.with()`.
