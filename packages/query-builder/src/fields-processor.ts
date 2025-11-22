import { Attachment } from '@taylordb/shared';

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
        // @ts-ignore
        value instanceof Attachment
      ) {
        newRecord[key] = value.toColumnValue() as any;
      }
    }
    return newRecord;
  }
}
