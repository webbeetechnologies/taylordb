/**
 * Copyright (c) 2025 TaylorDB
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

interface FileInformation {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
  format: string;
  width: number;
  height: number;
}

interface UploadResponse {
  collectionName: string;
  fileInformation: FileInformation;
  metadata: {
    thumbnails: any[];
    clips: any[];
  };
  baseId: string;
  storageAdaptor: string;
  _id: string;
  __v: number;
}

export interface AttachmentColumnValue {
  url: string;
  fileType: string;
  size: number;
}

export class Attachment {
  public readonly collectionName: string;
  public readonly fileInformation: FileInformation;
  public readonly metadata: { thumbnails: any[]; clips: any[] };
  public readonly baseId: string;
  public readonly storageAdaptor: string;
  public readonly _id: string;

  constructor(data: UploadResponse) {
    this.collectionName = data.collectionName;
    this.fileInformation = data.fileInformation;
    this.metadata = data.metadata;
    this.baseId = data.baseId;
    this.storageAdaptor = data.storageAdaptor;
    this._id = data._id;
  }

  toColumnValue(): AttachmentColumnValue {
    return {
      url: this.fileInformation.path,
      fileType: this.fileInformation.mimetype,
      size: this.fileInformation.size,
    };
  }
}

type IsWithinOperatorValue =
  | 'pastWeek'
  | 'pastMonth'
  | 'pastYear'
  | 'nextWeek'
  | 'nextMonth'
  | 'nextYear'
  | 'daysFromNow'
  | 'daysAgo'
  | 'currentWeek'
  | 'currentMonth'
  | 'currentYear';

type DefaultDateFilterValue =
  | (
      | 'today'
      | 'tomorrow'
      | 'yesterday'
      | 'oneWeekAgo'
      | 'oneWeekFromNow'
      | 'oneMonthAgo'
      | 'oneMonthFromNow'
    )
  | ['exactDay' | 'exactTimestamp', string]
  | ['daysAgo' | 'daysFromNow', number];

type DateFilters = {
  '=': DefaultDateFilterValue;
  '!=': DefaultDateFilterValue;
  '<': DefaultDateFilterValue;
  '>': DefaultDateFilterValue;
  '<=': DefaultDateFilterValue;
  '>=': DefaultDateFilterValue;
  isWithIn:
    | IsWithinOperatorValue
    | { value: 'daysAgo' | 'daysFromNow'; date: number };
  isEmpty: boolean;
  isNotEmpty: boolean;
};

type DateAggregations = {
  empty: number;
  filled: number;
  unique: number;
  percentEmpty: number;
  percentFilled: number;
  percentUnique: number;
  min: number | null;
  max: number | null;
  daysRange: number | null;
  monthRange: number | null;
};

type TextFilters = {
  '=': string;
  '!=': string;
  caseEqual: string;
  hasAnyOf: string[];
  contains: string;
  startsWith: string;
  endsWith: string;
  doesNotContain: string;
  isEmpty: never;
  isNotEmpty: never;
};

export type SearchTextFilters = {
  search: string;
  contains: string;
  containsStrict: string;
  isEmpty: never;
  isNotEmpty: never;
};

type LinkFilters = {
  hasAnyOf: number[];
  hasAllOf: number[];
  isExactly: number[];
  '=': number;
  hasNoneOf: number[];
  contains: string;
  doesNotContain: string;
  isEmpty: never;
  isNotEmpty: never;
};

type SelectFilters<O extends readonly string[]> = {
  hasAnyOf: O[number][];
  hasAllOf: O[number][];
  isExactly: O[number][];
  '=': O[number];
  hasNoneOf: O[number][];
  contains: string;
  doesNotContain: string;
  isEmpty: never;
  isNotEmpty: never;
};

type LinkAggregations = {
  empty: number;
  filled: number;
  percentEmpty: number;
  percentFilled: number;
};

type NumberFilters = {
  '=': number;
  '!=': number;
  '>': number;
  '>=': number;
  '<': number;
  '<=': number;
  hasAnyOf: number[];
  hasNoneOf: number[];
  isEmpty: never;
  isNotEmpty: never;
};

type NumberAggregations = {
  sum: number;
  average: number;
  median: number;
  min: number | null;
  max: number | null;
  range: number;
  standardDeviation: number;
  histogram: Record<string, number>;
  empty: number;
  filled: number;
  unique: number;
  percentEmpty: number;
  percentFilled: number;
  percentUnique: number;
};

type CheckboxFilters = {
  '=': number;
};

/**
 *
 * Column types
 *
 */
export type ColumnType<
  S,
  U,
  I,
  R extends boolean,
  F extends { [key: string]: any } = object,
  A extends { [key: string]: any } = object,
> = {
  raw: S;
  insert: I;
  update: U;
  filters: F;
  aggregations: A;
  isRequired: R;
};

export type DateColumnType<R extends boolean> = ColumnType<
  string,
  string,
  string,
  R,
  DateFilters,
  DateAggregations
>;

export type TextColumnType<R extends boolean> = ColumnType<
  string,
  string,
  string,
  R,
  TextFilters
>;

export type SearchColumnType<R extends boolean> = ColumnType<
  string,
  string,
  string,
  R,
  SearchTextFilters
>;

export type ALinkColumnType<
  T extends string,
  S,
  U,
  I,
  R extends boolean,
  F extends { [key: string]: any } = LinkFilters,
  A extends LinkAggregations = LinkAggregations,
> = ColumnType<S, U, I, R, F, A> & {
  linkedTo: T;
};

export type LinkColumnType<
  T extends string,
  R extends boolean,
> = ALinkColumnType<
  T,
  object,
  number[] | { newIds: number[]; deletedIds: number[] },
  number[],
  R
>;

export type AttachmentColumnType<R extends boolean> = ColumnType<
  string[],
  Attachment[] | { newIds: number[]; deletedIds: number[] } | number[],
  Attachment[] | number[],
  R,
  LinkFilters,
  LinkAggregations
>;

export type SingleSelectColumnType<
  O extends readonly string[],
  R extends boolean,
> = ColumnType<O[number], O[number], O[number], R, SelectFilters<O>>;

export type MultiSelectColumnType<
  O extends readonly string[],
  R extends boolean,
> = ColumnType<O[number][], O[number][], O[number][], R, SelectFilters<O>>;

export type NumberColumnType<R extends boolean> = ColumnType<
  number,
  number,
  number,
  R,
  NumberFilters,
  NumberAggregations
>;

export type CheckboxColumnType<R extends boolean> = ColumnType<
  boolean,
  boolean,
  boolean,
  R,
  CheckboxFilters
>;

export type AutoGeneratedNumberColumnType = ColumnType<
  number,
  never,
  never,
  false,
  NumberFilters,
  NumberAggregations
>;

export type AutoGeneratedDateColumnType = ColumnType<
  string,
  never,
  never,
  false,
  DateFilters,
  DateAggregations
>;

export type TableRaws<T extends keyof TaylorDatabase> = {
  [K in keyof TaylorDatabase[T]]: TaylorDatabase[T][K] extends ColumnType<
    infer S,
    any,
    any,
    infer R,
    any,
    any
  >
    ? R extends true
      ? S
      : S | undefined
    : never;
};

export type TableInserts<T extends keyof TaylorDatabase> = {
  [K in keyof TaylorDatabase[T]]: TaylorDatabase[T][K] extends ColumnType<
    any,
    infer I,
    any,
    infer R,
    any,
    any
  >
    ? R extends true
      ? I
      : I | undefined
    : never;
};

export type TableUpdates<T extends keyof TaylorDatabase> = {
  [K in keyof TaylorDatabase[T]]: TaylorDatabase[T][K] extends ColumnType<
    any,
    any,
    infer U,
    any,
    any,
    any
  >
    ? U
    : never;
};

export type AttachmentTable = {
  id: AutoGeneratedNumberColumnType;
  name: TextColumnType<true>;
  metadata: TextColumnType<true>;
  size: NumberColumnType<true>;
  fileType: TextColumnType<true>;
  url: TextColumnType<true>;
  searchText: SearchColumnType<true>;
};

export type CollaboratorsTable = {
  id: AutoGeneratedNumberColumnType;
  name: TextColumnType<true>;
  emailAddress: TextColumnType<true>;
  avatar: TextColumnType<true>;
  searchText: SearchColumnType<true>;
};

export type TaylorDatabase = {
  /**
   *
   *
   * Internal tables, these tables can not be queried directly.
   *
   */
  attachmentTable: AttachmentTable;
  collaborators: CollaboratorsTable;
  backlog: BacklogTable;
  sprints: SprintsTable;
  epics: EpicsTable;
};

export const BacklogStatusOptions = [
  'Needs improvement 🤔',
  'Irreproducible 🙅‍♂️',
  'Reopen',
  'On Hold',
  'dev testing',
  'Delegate 🌟🤝',
  '🌈 Brainstorming',
  'Ice Box',
  'Backlog',
  'Iteration 🔄',
  'Needs Discussion',
  'In progress 👩‍💻',
  'Reproduced and unassigned',
  'Ready for release',
  'Released',
  'Assigned. Never started',
  'Not a bug 🪲',
  'Pending',
  'done',
  'Not Needed',
  'done',
  'Doing today 🌞',
  'Done  🎉',
  'Trash 🗑',
  'Blocked',
  'Code review',
  'Investigating 🔎',
  'In Testing 💪',
] as const;
export const BacklogPrioOptions = [
  'Low',
  'Medium',
  '🙀 High',
  '🙀🙀🙀 Highest',
  'Doing today 🌞',
  'Important',
] as const;
export const BacklogTypeOptions = [
  'Backend Bug',
  'Frontend Bug',
  'Todo',
  'Feature',
  'View Issues',
  'Navigation Issues',
  'Field Issues',
  'Subscription Issues',
  'Application State Issues',
  'UI inconsistencies ',
  'Filter Issues',
  'Importer Issues',
  'Authentication Issues',
  'Dashboard API Issues',
  'UI improvement',
  'Email Issues',
  'Base import',
  'UX Bugs',
  'Chat Issues',
  'Sharing Issues',
  'User Management Issues',
  'Onboarding Issue',
  'Dashboard Issues',
  'Inline Editing Issues',
  'Design Inconsistency',
  'Copy&Paste',
  'Bug',
  'Slowness',
  'Icon Issues',
  'Diff Issues',
  'https://www.loom.com/share/fbc379199af74a259db6ef723540e394',
] as const;
export const BacklogTypesOptions = [] as const;

type BacklogTable = {
  id: NumberColumnType<false>;
  createdAt: AutoGeneratedDateColumnType;
  updatedAt: AutoGeneratedDateColumnType;
  searchText: SearchColumnType<true>;
  title: TextColumnType<false>;
  status: SingleSelectColumnType<typeof BacklogStatusOptions, false>;
  prio: SingleSelectColumnType<typeof BacklogPrioOptions, false>;
  est: NumberColumnType<false>;
  responsible: LinkColumnType<'collaborators', false>;
  modifiedAt: AutoGeneratedDateColumnType;
  description: TextColumnType<false>;
  null: AutoGeneratedDateColumnType;
  isToday: NumberColumnType<false>;
  isTodayyesterday: NumberColumnType<false>;
  lastModified: AutoGeneratedDateColumnType;
  type: SingleSelectColumnType<typeof BacklogTypeOptions, false>;
  coResponsible: LinkColumnType<'collaborators', false>;
  sprint: LinkColumnType<'sprints', false>;
  epic: LinkColumnType<'epics', false>;
  attachment: AttachmentColumnType<false>;
  modifiedBy: LinkColumnType<'collaborators', false>;
  descForNeedsImprovement: TextColumnType<false>;
  types: MultiSelectColumnType<typeof BacklogTypesOptions, false>;
  lywrt: TextColumnType<false>;
  loggedTime: NumberColumnType<false>;
  nr: AutoGeneratedNumberColumnType;
  autoNumber: AutoGeneratedNumberColumnType;
  date: DateColumnType<false>;
};

export const SprintsStatusOptions = [
  'Started',
  'Done',
  'Planned',
  'Review',
  'Test',
] as const;
export const SprintsSprintStatusOptions = [] as const;

type SprintsTable = {
  id: NumberColumnType<false>;
  createdAt: AutoGeneratedDateColumnType;
  updatedAt: AutoGeneratedDateColumnType;
  searchText: SearchColumnType<true>;
  backlog: LinkColumnType<'backlog', false>;
  name: TextColumnType<false>;
  beschreibung: TextColumnType<false>;
  status: SingleSelectColumnType<typeof SprintsStatusOptions, false>;
  epics: TextColumnType<false>;
  table7: TextColumnType<false>;
  end: DateColumnType<false>;
  start: DateColumnType<false>;
  sprintStatus: SingleSelectColumnType<
    typeof SprintsSprintStatusOptions,
    false
  >;
  calendarWeek: TextColumnType<false>;
};

export const EpicsStatusOptions = [
  'Planned',
  'In progress',
  'Done',
  'Archive',
] as const;
export const EpicsAreaOptions = [
  'Frontend - Screens',
  'Frontend - Components',
  'Frontend',
  'Backend',
  'DB Lib Components',
  'Design',
  'Machine learning',
  'Chat',
  'Bamboo',
  'Butlerapp',
] as const;
export const EpicsPriorityOptions = [
  '☄️ Must Have',
  ' 🧁 Nice To Have',
] as const;
export const EpicsLabelOptions = [
  'UX Development',
  'UI Design',
  'API',
  'Architecture',
  'Server',
] as const;

type EpicsTable = {
  id: NumberColumnType<false>;
  createdAt: AutoGeneratedDateColumnType;
  updatedAt: AutoGeneratedDateColumnType;
  searchText: SearchColumnType<true>;
  backlog: LinkColumnType<'backlog', false>;
  name: TextColumnType<false>;
  status: SingleSelectColumnType<typeof EpicsStatusOptions, false>;
  collaborator: LinkColumnType<'collaborators', false>;
  description: TextColumnType<false>;
  area: SingleSelectColumnType<typeof EpicsAreaOptions, false>;
  blocks: LinkColumnType<'epics', false>;
  order: NumberColumnType<false>;
  priority: SingleSelectColumnType<typeof EpicsPriorityOptions, false>;
  label: MultiSelectColumnType<typeof EpicsLabelOptions, false>;
  statusModifiedAt: AutoGeneratedDateColumnType;
  created: AutoGeneratedDateColumnType;
  prd: TextColumnType<false>;
  countBacklog: NumberColumnType<false>;
  start: DateColumnType<false>;
  end: DateColumnType<false>;
};
