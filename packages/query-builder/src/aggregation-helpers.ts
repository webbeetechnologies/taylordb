/**
 * Helper functions for creating aggregation metrics.
 * These functions return objects that describe the aggregation to perform.
 */

export type AggregationHelper<
  TField extends string = string,
  TAggregation extends string = string,
> = {
  field: TField;
  aggregation: TAggregation;
};

/**
 * Creates a count aggregation for the specified field.
 * @param field - The field name to count.
 * @returns An aggregation helper object.
 *
 * @example
 * ```typescript
 * count('id')
 * ```
 */
export function count<TField extends string>(
  field: TField,
): AggregationHelper<TField, 'count'> {
  return { field, aggregation: 'count' as const };
}

/**
 * Creates an average aggregation for the specified field.
 * @param field - The field name to average.
 * @returns An aggregation helper object.
 *
 * @example
 * ```typescript
 * avg('age')
 * ```
 */
export function avg<TField extends string>(
  field: TField,
): AggregationHelper<TField, 'average'> {
  return { field, aggregation: 'average' as const };
}

/**
 * Creates a sum aggregation for the specified field.
 * @param field - The field name to sum.
 * @returns An aggregation helper object.
 *
 * @example
 * ```typescript
 * sum('age')
 * ```
 */
export function sum<TField extends string>(
  field: TField,
): AggregationHelper<TField, 'sum'> {
  return { field, aggregation: 'sum' as const };
}

/**
 * Creates a median aggregation for the specified field.
 * @param field - The field name to calculate median for.
 * @returns An aggregation helper object.
 */
export function median<TField extends string>(
  field: TField,
): AggregationHelper<TField, 'median'> {
  return { field, aggregation: 'median' as const };
}

/**
 * Creates a min aggregation for the specified field.
 * @param field - The field name to find minimum for.
 * @returns An aggregation helper object.
 */
export function min<TField extends string>(
  field: TField,
): AggregationHelper<TField, 'min'> {
  return { field, aggregation: 'min' as const };
}

/**
 * Creates a max aggregation for the specified field.
 * @param field - The field name to find maximum for.
 * @returns An aggregation helper object.
 */
export function max<TField extends string>(
  field: TField,
): AggregationHelper<TField, 'max'> {
  return { field, aggregation: 'max' as const };
}

/**
 * Creates a range aggregation for the specified field.
 * @param field - The field name to calculate range for.
 * @returns An aggregation helper object.
 */
export function range<TField extends string>(
  field: TField,
): AggregationHelper<TField, 'range'> {
  return { field, aggregation: 'range' as const };
}

/**
 * Creates a standard deviation aggregation for the specified field.
 * @param field - The field name to calculate standard deviation for.
 * @returns An aggregation helper object.
 */
export function stdDev<TField extends string>(
  field: TField,
): AggregationHelper<TField, 'standardDeviation'> {
  return { field, aggregation: 'standardDeviation' as const };
}

/**
 * Creates a unique count aggregation for the specified field.
 * @param field - The field name to count unique values for.
 * @returns An aggregation helper object.
 */
export function unique<TField extends string>(
  field: TField,
): AggregationHelper<TField, 'unique'> {
  return { field, aggregation: 'unique' as const };
}
