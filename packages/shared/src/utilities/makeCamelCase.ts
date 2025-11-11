import camelCase from 'lodash/camelCase';

export const makeCamelCase = (...strings: string[]) =>
  camelCase(strings.join(' '));

export default makeCamelCase;
