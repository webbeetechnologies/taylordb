import { TypeMapper } from '../type-generator/type-mapper';
import { BambooField } from '../lib/types';
import type { BambooFieldsType } from '@taylordb/query-builder';
import { exposingFieldTypes } from '@taylordb/query-builder';

const makeField = (
  type: string,
  options: Record<string, any> = {},
  returnType = 'string',
): BambooField => ({
  id: 1,
  name: type,
  title: type,
  type,
  options,
  returnType,
});

describe('TypeMapper', () => {
  const mapper = new TypeMapper(
    {
      tablesSchema: [{ slug: 'linked-table', name: 'linkedTable' }],
    } as any,
    new Map([
      [
        'select-options',
        [
          { id: 1, name: 'Open' },
          { id: 2, name: 'Closed' },
        ],
      ],
    ]),
  );

  it('emits field-specific helpers for exposed Bamboo field types', () => {
    const coveredTypes = [
      'json',
      'number',
      'date',
      'modifiedAt',
      'link',
      'currency',
      'percent',
      'url',
      'email',
      'phoneNumber',
      'checkbox',
      'select',
      'count',
      'autoNumber',
      'formula',
      'position',
      'rating',
      'createdAt',
      'updatedAt',
      'singleLineText',
      'text',
      'longText',
      'lookup',
      'rollup',
      'collaborators',
      'modifiedBy',
      'duration',
      'createdBy',
      'attachment',
      'button',
    ] satisfies BambooFieldsType[];

    expect(new Set(coveredTypes)).toEqual(new Set(exposingFieldTypes));

    expect(mapper.map(makeField('json'))).toBe(
      'jsonField({ required: false })',
    );
    expect(mapper.map(makeField('number'))).toBe(
      'numberField({ required: false })',
    );
    expect(mapper.map(makeField('date'))).toBe(
      'dateField({ required: false })',
    );
    expect(mapper.map(makeField('modifiedAt'))).toBe('modifiedAtField()');
    expect(mapper.map(makeField('link', { on: 'linked-table' }))).toBe(
      'linkField({ required: false, linkedTo: "linkedTable" })',
    );
    expect(mapper.map(makeField('currency'))).toBe(
      'currencyField({ required: false })',
    );
    expect(mapper.map(makeField('percent'))).toBe(
      'percentField({ required: false })',
    );
    expect(mapper.map(makeField('url'))).toBe(
      'urlField({ required: false })',
    );
    expect(mapper.map(makeField('email'))).toBe(
      'emailField({ required: false })',
    );
    expect(mapper.map(makeField('phoneNumber'))).toBe(
      'phoneNumberField({ required: false })',
    );
    expect(mapper.map(makeField('checkbox'))).toBe(
      'checkboxField({ required: false })',
    );
    expect(
      mapper.map(
        makeField('select', { on: 'select-options', isSingle: true }),
      ),
    ).toBe(
      'selectField({ required: false, mode: \'single\', options: ["Open", "Closed"] as const })',
    );
    expect(mapper.map(makeField('count'))).toBe(
      'countField({ required: false })',
    );
    expect(mapper.map(makeField('autoNumber'))).toBe('autoNumberField()');
    expect(mapper.map(makeField('formula', {}, 'number'))).toBe(
      "formulaField({ returnType: 'number' })",
    );
    expect(mapper.map(makeField('position'))).toBe(
      'positionField({ required: false })',
    );
    expect(mapper.map(makeField('rating'))).toBe(
      'ratingField({ required: false })',
    );
    expect(mapper.map(makeField('createdAt'))).toBe('createdAtField()');
    expect(mapper.map(makeField('updatedAt'))).toBe('updatedAtField()');
    expect(mapper.map(makeField('singleLineText'))).toBe(
      'singleLineTextField({ required: false })',
    );
    expect(mapper.map(makeField('text'))).toBe(
      'textField({ required: false })',
    );
    expect(mapper.map(makeField('longText'))).toBe(
      'longTextField({ required: false })',
    );
    expect(mapper.map(makeField('lookup', {}, 'json'))).toBe(
      "lookupField({ returnType: 'json' })",
    );
    expect(mapper.map(makeField('rollup', {}, 'date'))).toBe(
      "rollupField({ returnType: 'date' })",
    );
    expect(mapper.map(makeField('collaborators'))).toBe(
      'collaboratorsField({ required: false })',
    );
    expect(mapper.map(makeField('modifiedBy'))).toBe(
      'modifiedByField({ required: false })',
    );
    expect(mapper.map(makeField('duration'))).toBe(
      'durationField({ required: false })',
    );
    expect(mapper.map(makeField('createdBy'))).toBe(
      'createdByField({ required: false })',
    );
    expect(mapper.map(makeField('attachment'))).toBe(
      'attachmentField({ required: false })',
    );
    expect(mapper.map(makeField('button'))).toBe(
      'buttonField({ required: false })',
    );
  });
});
