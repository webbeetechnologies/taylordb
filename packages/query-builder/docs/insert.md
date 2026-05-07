# Insert

Use `insertInto` to create one or more records in a table.

## Basic usage

```ts
const record = await qb
  .insertInto('users')
  .values({ name: 'Alice', email: 'alice@example.com' })
  .executeTakeFirst();
// returns { id: number } by default
```

## Methods

### `.values(record | record[])`

Pass a single object or an array of objects. Each key must match a field name on the table. Required fields (typed as `IsRequired = true`) will cause a TypeScript error if omitted.

```ts
// single
.values({ name: 'Alice' })

// batch
.values([{ name: 'Alice' }, { name: 'Bob' }])
```

Attachment fields expect an `Attachment[]` value. Upload first with `qb.uploadAttachments()`, then pass the returned instances directly — the builder converts them to the correct column format automatically. See [file-upload.md](./file-upload.md).

Link fields expect `number[]` — the IDs of the records you want to associate.

### `.returning(fields[])`

Specify which fields to include in the response. Without `.returning()` only `id` is returned.

```ts
const user = await qb
  .insertInto('users')
  .values({ name: 'Alice' })
  .returning(['id', 'name', 'email'])
  .executeTakeFirst();
// user: { id: number; name: string; email: string }
```

Only non-link fields can be passed to `.returning()`. To include related records, use an `UpdateQueryBuilder` after the insert.

### `.execute()`

Runs the insert and returns an array of records matching the `.returning()` selection.

```ts
const users = await qb
  .insertInto('users')
  .values([{ name: 'Alice' }, { name: 'Bob' }])
  .returning(['id', 'name'])
  .execute();
// users: Array<{ id: number; name: string }>
```

### `.executeTakeFirst()`

Same as `.execute()` but returns the first result or `null`.

```ts
const user = await qb
  .insertInto('users')
  .values({ name: 'Alice' })
  .returning(['id', 'name'])
  .executeTakeFirst();
// user: { id: number; name: string } | null
```

## Restrictions

- `attachmentTable` and `collaborators` are blacklisted and cannot be inserted into.
- Auto-generated fields (`id`, `createdAt`, `updatedAt`, `autoNumber`) have insert type `never` — passing them causes a TypeScript error.
- Link fields on insert accept only `number[]` (adding IDs). To selectively add/remove links on an existing record use `.update().set({ field: { newIds: [], deletedIds: [] } })`.
