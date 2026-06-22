/**
 * Copyright (c) 2025 TaylorDB
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  autoNumberField,
  attachmentField,
  collaboratorsField,
  countField,
  createdAtField,
  createdByField,
  dateField,
  defineTaylorSchema,
  durationField,
  formulaField,
  linkField,
  longTextField,
  lookupField,
  modifiedAtField,
  modifiedByField,
  numberField,
  searchField,
  selectField,
  singleLineTextField,
  textField,
  updatedAtField,
  urlField,
} from '@taylordb/query-builder';
import type { InferTaylorDatabase } from '@taylordb/query-builder';

export const taylorSchema = defineTaylorSchema({
  attachmentTable: {
    id: autoNumberField(),
    name: textField({ required: true }),
    metadata: textField({ required: true }),
    size: numberField({ required: true }),
    fileType: textField({ required: true }),
    url: textField({ required: true }),
    searchText: searchField(),
  },
  collaborators: {
    id: autoNumberField(),
    name: textField({ required: true }),
    emailAddress: textField({ required: true }),
    avatar: textField({ required: true }),
    // Collaborator lifecycle status. Expected values are ACTIVE or INACTIVE.
    status: textField({ required: true }),
    searchText: searchField(),
  },
  backlog: {
    id: autoNumberField(),
    createdAt: createdAtField(),
    updatedAt: updatedAtField(),
    searchText: searchField(),
    title: singleLineTextField({ required: false }),
    status: selectField({
      required: false,
      mode: 'single',
      options: ['Option 1', 'Option 2'] as const,
    }),
    prio: selectField({
      required: false,
      mode: 'single',
      options: ['Option 1', 'Option 2'] as const,
    }),
    est: durationField({ required: false }),
    responsible: collaboratorsField({ required: false }),
    modifiedAt: modifiedAtField(),
    description: longTextField({ required: false }),
    createdBy: createdByField({ required: false }),
    null: modifiedAtField(),
    isToday: formulaField({ returnType: 'number' }),
    isTodayyesterday: formulaField({ returnType: 'number' }),
    lastModified: modifiedAtField(),
    type: selectField({
      required: false,
      mode: 'single',
      options: ['Option 1', 'Option 2'] as const,
    }),
    coResponsible: collaboratorsField({ required: false }),
    sprint: linkField({ required: false, linkedTo: 'sprints' }),
    epic: linkField({ required: false, linkedTo: 'epics' }),
    attachment: attachmentField({ required: false }),
    modifiedBy: modifiedByField({ required: false }),
    descForNeedsImprovement: longTextField({ required: false }),
    types: selectField({
      required: false,
      mode: 'multi',
      options: [] as const,
    }),
    lywrt: longTextField({ required: false }),
    sprintStatus: lookupField({ returnType: 'json' }),
    statusFromEpics: lookupField({ returnType: 'json' }),
    areaFromEpics: lookupField({ returnType: 'json' }),
    loggedTime: durationField({ required: false }),
    nr: autoNumberField(),
    autoNumber: autoNumberField(),
    date: dateField({ required: false }),
  },
  sprints: {
    id: autoNumberField(),
    createdAt: createdAtField(),
    updatedAt: updatedAtField(),
    searchText: searchField(),
    backlog: linkField({ required: false, linkedTo: 'backlog' }),
    name: singleLineTextField({ required: false }),
    beschreibung: longTextField({ required: false }),
    status: selectField({
      required: false,
      mode: 'single',
      options: ['Option 1', 'Option 2'] as const,
    }),
    epics: singleLineTextField({ required: false }),
    table7: singleLineTextField({ required: false }),
    end: dateField({ required: false }),
    start: dateField({ required: false }),
    sprintStatus: selectField({
      required: false,
      mode: 'single',
      options: [] as const,
    }),
    calendarWeek: formulaField({ returnType: 'string' }),
  },
  epics: {
    id: autoNumberField(),
    createdAt: createdAtField(),
    updatedAt: updatedAtField(),
    searchText: searchField(),
    backlog: linkField({ required: false, linkedTo: 'backlog' }),
    name: singleLineTextField({ required: false }),
    status: selectField({
      required: false,
      mode: 'single',
      options: ['Option 1', 'Option 2'] as const,
    }),
    collaborator: collaboratorsField({ required: false }),
    description: longTextField({ required: false }),
    area: selectField({
      required: false,
      mode: 'single',
      options: ['Option 1', 'Option 2'] as const,
    }),
    blocks: linkField({ required: false, linkedTo: 'epics' }),
    order: numberField({ required: false }),
    priority: selectField({
      required: false,
      mode: 'single',
      options: ['☄️ Must Have', ' 🧁 Nice To Have'] as const,
    }),
    label: selectField({
      required: false,
      mode: 'multi',
      options: ['Option 1', 'Option 2'] as const,
    }),
    statusModifiedAt: modifiedAtField(),
    created: createdAtField(),
    prd: urlField({ required: false }),
    countBacklog: countField({ required: false }),
    start: dateField({ required: false }),
    end: dateField({ required: false }),
  },
});

/** Generic type for plugin actions */
export type PluginActionType<I, O> = { input: I; result: O };
export interface PluginTypesEmailSendInput {
  to?: string;
  subject?: string;
  body?: string;
}

export interface PluginTypesEmailSendOutput {
  success?: boolean;
}

export interface PluginTypesSmsSendInput {
  to?: string;
  body?: string;
}

export interface PluginTypesSmsSendOutput {
  success?: boolean;
}
export type TaylorDatabase = InferTaylorDatabase<typeof taylorSchema> & {
  _plugins: {
    email: {
      /**
       * Send an email
       */
      send: PluginActionType<
        PluginTypesEmailSendInput,
        PluginTypesEmailSendOutput
      >;
    };
    sms: {
      /**
       * Send an SMS
       */
      send: PluginActionType<PluginTypesSmsSendInput, PluginTypesSmsSendOutput>;
    };
  };
};
