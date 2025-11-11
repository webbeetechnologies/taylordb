export const makeSelectKey = <F extends string, S extends string>(
  tableName: F,
  column: S,
) => `${tableName}.${column}` as const;
