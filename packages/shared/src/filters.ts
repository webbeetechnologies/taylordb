/**
 * Copyright (c) 2025 TaylorDB
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type Filters = {
  text: {
    operators: {
      '=': string;
      '!=': string;
      caseEqual: string;
      hasAnyOf: string[];
      contains: string;
      startsWith: string;
      endsWith: string;
      doesNotContain: string;
    };
  };
  number: {
    operators: {
      '=': number;
      '!=': number;
      '>': number;
      '>=': number;
      '<': number;
      '<=': number;
      hasAnyOf: number[];
      hasNoneOf: number[];
    };
  };
  checkbox: {
    operators: {
      '=': number;
    };
  };
  link: {
    operators: {
      hasAnyOf: number[];
      hasAllOf: number[];
      isExactly: number[];
      '=': number[];
      hasNoneOf: number[];
    };
  };
};
