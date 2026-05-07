# Current User

The query builder exposes a built-in way to get the currently authenticated user's profile record.

## Usage

```ts
const user = await qb.auth.getUser();
```

## Return value

```ts
{
  id: number;
  name: string;
  email: string;
  avatar: string;
} | null
```

Returns `null` when no matching collaborator record is found.

## How it works

`getUser()` pulls the user ID from the active WebSocket/HTTP connection, then looks up that ID in the `bambooCollaborators` internal table using a filter on `externalId`. Only active collaborators (those with `status = 'ACTIVE'`) are considered.

## Requirement

Authentication must have been established at the connection level — i.e. the `apiKey` provided to `createQueryBuilder` must be a valid user token, not just a public API key. If the connection has no user ID attached, `getUser()` throws:

```
Error: User ID not available from the connection
```

## Example

```ts
const qb = createQueryBuilder<TaylorDatabase>({
  baseUrl: 'https://your-instance.taylordb.ai',
  baseId: 'your-base-id',
  apiKey: 'user-bearer-token',
});

const me = await qb.auth.getUser();

if (me) {
  console.log(`Hello ${me.name} (${me.email})`);
}
```
