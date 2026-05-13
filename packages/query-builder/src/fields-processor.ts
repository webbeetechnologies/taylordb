import { Attachment } from '@taylordb/shared';

const MEDIA_UPLOADER_HOST = 'https://media.taylordb.ai';

export class FieldsProcessor {
  public process<T extends Record<string, any>>(record: T): T {
    const newRecord = { ...record };
    for (const key in newRecord) {
      const value = newRecord[key];

      if (
        Array.isArray(value) &&
        value.length > 0 &&
        value[0] instanceof Attachment
      ) {
        newRecord[key] = value.map((att: Attachment) =>
          att.toColumnValue(),
        ) as any;
      } else if (
        typeof value === 'object' &&
        value !== null &&
        'newAttachments' in value &&
        Array.isArray(value.newAttachments)
      ) {
        newRecord[key] = {
          ...value,
          newAttachments: value.newAttachments.map((att: Attachment) =>
            att.toColumnValue(),
          ),
          deletedUrls: Array.isArray(value.deletedUrls)
            ? value.deletedUrls.map((url: string) =>
                this.normalizeAttachmentUrl(url),
              )
            : value.deletedUrls,
        } as any;
      } else if (
        typeof value === 'object' &&
        value !== null &&
        // @ts-ignore
        value instanceof Attachment
      ) {
        newRecord[key] = value.toColumnValue() as any;
      }
    }
    return newRecord;
  }

  private normalizeAttachmentUrl(url: string): string {
    if (typeof url !== 'string') return url as any;

    if (url.startsWith('files/')) {
      return url;
    }

    if (url.startsWith(`${MEDIA_UPLOADER_HOST}/`)) {
      return url.slice(MEDIA_UPLOADER_HOST.length + 1);
    }

    return url;
  }
}
