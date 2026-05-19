# @taylordb/cli

This is the command-line interface for TaylorDB.

## Installation

```bash
pnpm install
```

## Usage

You can use the CLI by running the `taylordb` script from the root of the monorepo:

```bash
pnpm taylordb --help
```

### Commands

- `login`: Authenticate with TaylorDB.
- `generate-schema <appUrl> <output>`: Generate a runtime `taylorSchema` object and inferred `TaylorDatabase` type for `@taylordb/query-builder`.

```bash
pnpm taylordb login
```

```bash
pnpm taylordb generate-schema https://app.taylordb.ai/workspaces/demo/databases/42 ./src/taylorclient.types.ts
```
