# File Upload (Attachments)

Attachment fields store files. The upload and the record write are two separate steps.

## Step 1 — upload the files

Call `qb.uploadAttachments()` with an array of `{ file, name }` objects. This sends the files to the TaylorDB media service and returns an array of `Attachment` instances.

```ts
const attachments = await qb.uploadAttachments([
  { file: myBlob, name: 'invoice.pdf' },
  { file: anotherBlob, name: 'receipt.png' },
]);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `file` | `Blob` | The file content (a browser `File` extends `Blob`) |
| `name` | `string` | The filename including extension |

Returns `Attachment[]`. Each `Attachment` object holds metadata: `collectionName`, `fileInformation`, `baseId`, `storageAdaptor`, `_id`.

The upload uses your `apiKey` and `baseId` from the query builder config for authentication.

## Step 2 — write the record

Pass the `Attachment[]` array as the value for any `AttachmentColumnType` field. The builder automatically calls `.toColumnValue()` on each attachment to convert it to the format the API expects.

```ts
const attachments = await qb.uploadAttachments([
  { file: invoiceBlob, name: 'invoice.pdf' },
]);

const record = await qb
  .insertInto('expenses')
  .values({
    title: 'Office supplies',
    receipt: attachments,          // AttachmentColumnType field
  })
  .returning(['id', 'title'])
  .executeTakeFirst();
```

The same works for update:

```ts
const newAttachments = await qb.uploadAttachments([
  { file: newFileBlob, name: 'updated-receipt.pdf' },
]);

await qb
  .update('expenses')
  .set({ receipt: newAttachments })
  .where('id', '=', 42)
  .execute();
```

To replace some attachments while keeping others, use the `{ newAttachments, deletedUrls }` form that `AttachmentColumnType` update accepts:

```ts
const uploadedAttachments = await qb.uploadAttachments([
  { file: replacementBlob, name: 'replacement.jpg' },
]);

await qb
  .update('expenses')
  .set({
    receipt: {
      newAttachments: uploadedAttachments,
      deletedUrls: ['https://media.taylordb.ai/files/something.jpg'],
    },
  })
  .where('id', '=', 42)
  .execute();
```

## Reading attachments

When you select an attachment field the query builder automatically converts the raw storage path to a full absolute URL.

```ts
const record = await qb
  .selectFrom('expenses')
  .select(['id', 'receipt'])
  .executeTakeFirst();

// record.receipt is string[] — each entry is a full URL:
// 'https://media.taylordb.ai/files/...'
```
