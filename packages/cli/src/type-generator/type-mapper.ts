import { BambooField } from '../lib/types.js';
import { TaylorTypeGenerator } from './taylor-type-generator.js';

export class TypeMapper {
  constructor(private readonly taylorTypeGenerator: TaylorTypeGenerator) {}

  map(column: BambooField) {
    switch (column.type) {
      case 'singleLineText':
      case 'text':
      case 'json':
      case 'url':
      case 'email':
      case 'phoneNumber':
      case 'longText':
        return 'TextColumnType';

      case 'number':
      case 'autoNumber':
      case 'position':
      case 'percent':
      case 'duration':
      case 'decimalSerial':
      case 'serial':
        return 'NumberColumnType';

      case 'checkbox':
        return 'CheckboxColumnType';

      case 'link':
        return `LinkColumnType<'${this.findNameBySlug(column.options.on)}'>`;

      case 'modifiedBy':
      case 'collaborators':
        return "LinkColumnType<'collaboratorsTable'>";

      case 'attachment':
        return "LinkColumnType<'attachmentTable'>";

      case 'select':
        return "LinkColumnType<'selectTable'>";

      case 'createdAt':
      case 'updatedAt':
      case 'date':
      case 'modifiedAt':
        return 'DateColumnType';

      default:
        return null;
    }
  }

  private findNameBySlug(slug: string) {
    const table = this.taylorTypeGenerator.tablesSchema.find(
      table => table.slug === slug,
    );

    if (!table) {
      throw new Error(`Table with slug ${slug} not found`);
    }

    return table.name;
  }
}
