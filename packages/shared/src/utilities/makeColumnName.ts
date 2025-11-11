export const makeColumnName = (selectKey: string) => {
  return selectKey
    .split('.')
    .map(str => `"${str}"`)
    .join('.');
};
