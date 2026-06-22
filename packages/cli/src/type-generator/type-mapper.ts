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
        return `singleLineTextField(${requiredOption})`;

      case 'text':
        return `textField(${requiredOption})`;

      case 'json':
        return `jsonField(${requiredOption})`;

      case 'url':
        return `urlField(${requiredOption})`;

      case 'email':
        return `emailField(${requiredOption})`;

      case 'phoneNumber':
        return `phoneNumberField(${requiredOption})`;

      case 'longText':
        return `longTextField(${requiredOption})`;

      case 'button':
        return `buttonField(${requiredOption})`;

      case 'autoNumber':
        return `autoNumberField()`;

      case 'number':
        return `numberField(${requiredOption})`;

      case 'position':
        return `positionField(${requiredOption})`;

      case 'percent':
        return `percentField(${requiredOption})`;

      case 'duration':
        return `durationField(${requiredOption})`;

      case 'currency':
        return `currencyField(${requiredOption})`;

      case 'count':
        return `countField(${requiredOption})`;

      case 'rating':
        return `ratingField(${requiredOption})`;

      case 'decimalSerial':
      case 'serial':
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
        return `modifiedByField(${requiredOption})`;

      case 'collaborators':
        return `collaboratorsField(${requiredOption})`;

      case 'createdBy':
        return `createdByField(${requiredOption})`;

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
        return `createdAtField()`;

      case 'updatedAt':
        return `updatedAtField()`;

      case 'modifiedAt':
        return `modifiedAtField()`;

      case 'date':
        return `dateField(${requiredOption})`;

      case 'formula':
      case 'lookup':
      case 'rollup':
        return this.mapComputedField(column.type, column.returnType);

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

  private mapComputedField(type: 'formula' | 'lookup' | 'rollup', returnType: string) {
    switch (returnType) {
      case 'string':
      case 'json':
      case 'select':
      case 'number':
      case 'boolean':
      case 'date':
        return `${type}Field({ returnType: '${returnType}' })`;

      default:
        return null;
    }
  }
}
