import camelCase from 'lodash/camelCase.js';

export const makeCamelCase = (...strings: string[]) =>
  camelCase(strings.join(' '));

export default makeCamelCase;
