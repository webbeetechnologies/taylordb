# Conditions (Filtering)

Use `.where()` and `.orWhere()` to filter records. Both methods are available on `selectFrom`, `update`, `deleteFrom`, and aggregation queries.

## Simple condition

```ts
.where(field, operator, value)
```

```ts
const users = await qb
  .selectFrom('users')
  .select(['id', 'name'])
  .where('age', '>', 30)
  .execute();
```

The available operators and their accepted value types depend on the column type — see [field-types.md](./field-types.md) for the full operator table per type.

## Multiple AND conditions

Chaining `.where()` adds each condition with AND logic.

```ts
const users = await qb
  .selectFrom('users')
  .selectAll()
  .where('age', '>', 18)
  .where('role', '=', 'admin')
  .execute();
// age > 18 AND role = 'admin'
```

## OR conditions

`.orWhere()` has the same signature as `.where()` but switches the conjunction to OR for all conditions in the current group.

```ts
const users = await qb
  .selectFrom('users')
  .selectAll()
  .where('name', '=', 'Alice')
  .orWhere('name', '=', 'Bob')
  .execute();
// name = 'Alice' OR name = 'Bob'
```

## Grouped conditions (nested logic)

Pass a callback to `.where()` to create a nested group. The callback receives a fresh builder scoped to the same table and only the conditions added inside it form the group.

```ts
const users = await qb
  .selectFrom('users')
  .selectAll()
  .where('status', '=', 'active')
  .where(qb =>
    qb
      .where('role', '=', 'admin')
      .orWhere('role', '=', 'editor')
  )
  .execute();
// status = 'active' AND (role = 'admin' OR role = 'editor')
```

## Cross-table filtering (link fields)

When filtering on a link field you can pass a callback instead of a plain value. The callback receives a builder scoped to the **linked** table, letting you filter based on properties of the related records.

```ts
const users = await qb
  .selectFrom('users')
  .selectAll()
  .where('posts', 'hasAnyOf', qb =>
    qb.where('isPublished', '=', true)
  )
  .execute();
// users who have at least one published post
```

The operator you choose on the link field still applies (`hasAnyOf`, `hasAllOf`, `isExactly`, `hasNoneOf`), but the value is resolved by running the inner filter against the linked table.

## isEmpty / isNotEmpty

For operators that take no value (`isEmpty`, `isNotEmpty`), omit the third argument or pass `undefined`.

```ts
.where('bio', 'isEmpty')
.where('avatar', 'isNotEmpty')
```

## Checkbox fields

Checkbox filters use numeric values — `1` for true, `0` for false.

```ts
.where('isVerified', '=', 1)
```

## Date shorthand values

Date fields accept named shorthands in addition to exact values.

```ts
.where('createdAt', '=', 'today')
.where('dueDate', '<', ['daysFromNow', 7])
.where('updatedAt', 'isWithIn', 'pastWeek')
```

See [field-types.md](./field-types.md) for the full list of date filter values.
