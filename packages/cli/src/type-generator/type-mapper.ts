import { BambooField } from '../lib/types';
import { TaylorTypeGenerator } from './taylor-type-generator';

export class TypeMapper {
  constructor(
    private readonly taylorTypeGenerator: TaylorTypeGenerator,
    private readonly optionsMap: Map<string, { id: number; name: string }[]>,
  ) {}

  map(column: BambooField) {
    const isRequired = column.options['isRequired'] === true;
    const requiredOption = `{ required: ${isRequired ? 'true' : 'false'} }`;

    if (column.name === 'id') {
      return `autoNumberField()`;
    }

    switch (column.type) {
      case 'singleLineText':
      case 'text':
      case 'json':
      case 'url':
      case 'email':
      case 'phoneNumber':
      case 'longText':
        return `textField(${requiredOption})`;

      case 'autoNumber':
        return `autoNumberField()`;

      case 'number':
      case 'position':
      case 'percent':
      case 'duration':
      case 'decimalSerial':
      case 'serial':
      case 'currency':
        return `numberField(${requiredOption})`;

      case 'checkbox':
        return `checkboxField(${requiredOption})`;

      case 'link': {
        if (this.doesTableExist(column.options.on)) {
          return `linkField({ required: ${
            isRequired ? 'true' : 'false'
          }, linkedTo: ${JSON.stringify(this.findNameBySlug(column.options.on))} })`;
        }

        return null;
      }

      case 'modifiedBy':
      case 'collaborators':
        return `linkField({ required: ${
          isRequired ? 'true' : 'false'
        }, linkedTo: 'collaborators' })`;

      case 'attachment':
        return `attachmentField(${requiredOption})`;

      case 'search':
        return `searchField()`;

      case 'select': {
        const options = this.optionsMap.get(column.options.on);

        if (options) {
          const mode = column.options['isSingle'] ? 'single' : 'multi';
          const values = options
            .filter(option => option.name)
            .map(option => JSON.stringify(option.name))
            .join(', ');
          return `selectField({ required: ${
            isRequired ? 'true' : 'false'
          }, mode: '${mode}', options: [${values}] as const })`;
        }

        return `linkField({ required: ${
          isRequired ? 'true' : 'false'
        }, linkedTo: 'selectTable' })`;
      }

      case 'createdAt':
      case 'updatedAt':
      case 'modifiedAt':
        return `autoDateField()`;

      case 'date':
        return `dateField(${requiredOption})`;

      default: {
        switch (column.returnType) {
          case 'string':
            return `textField(${requiredOption})`;

          case 'number':
            return `numberField(${requiredOption})`;

          case 'boolean':
            return `checkboxField(${requiredOption})`;

          case 'date':
            return `dateField(${requiredOption})`;

          default:
            return null;
        }
      }
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

  private doesTableExist(tableSlug: string) {
    return this.taylorTypeGenerator.tablesSchema.some(
      table => table.slug === tableSlug,
    );
  }
}
