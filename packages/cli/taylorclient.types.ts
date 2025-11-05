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

export type ColumnType<S, U, I, T> = {
  raw: S;
  insert: I;
  update: U;
  type: T;
};

export type TextColumnType = ColumnType<
  string | undefined,
  string | undefined,
  string | null,
  'text'
>;

export type LinkColumnType<T> = ColumnType<
  object,
  number[] | {newIds: number[]; deletedIds: number[]} | undefined,
  number[] | undefined,
  'link'
> & {
  table: T;
};

export type NumberColumnType = ColumnType<
  number | undefined,
  number | undefined,
  number | undefined,
  'number'
>;

export type CheckboxColumnType = ColumnType<
  boolean | undefined,
  boolean | undefined,
  boolean | undefined,
  'checkbox'
>;

export type SelectTable = {
  id: NumberColumnType;
  name: TextColumnType;
  color: TextColumnType;
};

export type AttachmentTable = {
  id: NumberColumnType;
  name: TextColumnType;
  metadata: TextColumnType;
  size: NumberColumnType;
  fileType: TextColumnType;
  url: TextColumnType;
};

export type CollaboratorsTable = {
  id: NumberColumnType;
  name: TextColumnType;
  emailAddress: TextColumnType;
  avatar: TextColumnType;
};

interface CaloriesTable {
  timeOfDay: LinkColumnType<SelectTable>;
  proteinPer100G: NumberColumnType;
  carbsPer100G: NumberColumnType;
  fatsPer100G: NumberColumnType;
  mealName: TextColumnType;
  mealIngredient: TextColumnType;
  quantity: NumberColumnType;
  unit: LinkColumnType<SelectTable>;
}

interface StrengthTable {
  reps: NumberColumnType;
  weight: NumberColumnType;
  exercise: LinkColumnType<SelectTable>;
}

interface CardioTable {
  duration: NumberColumnType;
  distance: NumberColumnType;
  exercise: LinkColumnType<SelectTable>;
}

interface WeightTable {
  weight: NumberColumnType;
}

interface GoalsTable {
  name: TextColumnType;
  value: TextColumnType;
  description: TextColumnType;
}

interface SettingsTable {
  name: TextColumnType;
  value: TextColumnType;
  description: TextColumnType;
}

interface T1Table {
  name: TextColumnType;
}

export interface TaylorDatabase {
  calories: CaloriesTable;
  strength: StrengthTable;
  cardio: CardioTable;
  weight: WeightTable;
  goals: GoalsTable;
  settings: SettingsTable;
  t1: T1Table;
}
