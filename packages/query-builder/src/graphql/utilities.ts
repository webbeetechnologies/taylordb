import camelCase from 'lodash/camelCase';
import upperFirst from 'lodash/upperFirst';

export const makeCamelCase = (...strings: string[]) =>
  camelCase(strings.join(' '));

export const makeTypeName = (...str: string[]) =>
  upperFirst(makeCamelCase(...str));
