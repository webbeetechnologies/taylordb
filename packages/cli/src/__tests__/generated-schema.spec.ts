import { exposingFieldTypes } from '@taylordb/query-builder';
import { taylorSchema } from './generated-schema';

describe('generated schema playground fixture', () => {
  it('covers every exposed Bamboo field type', () => {
    const playgroundFields = Object.values(taylorSchema.playgroundAllFields);
    const generatedTypes = new Set(playgroundFields.map(field => field.type));

    for (const fieldType of exposingFieldTypes) {
      expect(generatedTypes).toContain(fieldType);
    }
  });

  it('preserves representative field-specific helper metadata', () => {
    expect(taylorSchema.playgroundAllFields.jsonValue.type).toBe('json');
    expect(taylorSchema.playgroundAllFields.currencyValue.type).toBe(
      'currency',
    );
    expect(taylorSchema.playgroundAllFields.phoneNumberValue.type).toBe(
      'phoneNumber',
    );
    expect(taylorSchema.playgroundAllFields.rollupValue).toMatchObject({
      type: 'rollup',
      returnType: 'date',
      insertable: false,
      updatable: false,
    });
    expect(taylorSchema.playgroundAllFields.buttonValue.type).toBe('button');
  });
});
