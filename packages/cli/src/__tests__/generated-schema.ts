/**
 * Copyright (c) 2025 TaylorDB
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  autoDateField,
  autoNumberField,
  attachmentField,
  dateField,
  defineTaylorSchema,
  linkField,
  numberField,
  searchField,
  selectField,
  textField,
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
    createdAt: autoDateField(),
    updatedAt: autoDateField(),
    searchText: searchField(),
    title: textField({ required: false }),
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
    est: numberField({ required: false }),
    responsible: linkField({ required: false, linkedTo: 'collaborators' }),
    modifiedAt: autoDateField(),
    description: textField({ required: false }),
    null: autoDateField(),
    isToday: numberField({ required: false }),
    isTodayyesterday: numberField({ required: false }),
    lastModified: autoDateField(),
    type: selectField({
      required: false,
      mode: 'single',
      options: ['Option 1', 'Option 2'] as const,
    }),
    coResponsible: linkField({ required: false, linkedTo: 'collaborators' }),
    sprint: linkField({ required: false, linkedTo: 'sprints' }),
    epic: linkField({ required: false, linkedTo: 'epics' }),
    attachment: attachmentField({ required: false }),
    modifiedBy: linkField({ required: false, linkedTo: 'collaborators' }),
    descForNeedsImprovement: textField({ required: false }),
    types: selectField({
      required: false,
      mode: 'multi',
      options: [] as const,
    }),
    lywrt: textField({ required: false }),
    loggedTime: numberField({ required: false }),
    nr: autoNumberField(),
    autoNumber: autoNumberField(),
    date: dateField({ required: false }),
  },
  sprints: {
    id: autoNumberField(),
    createdAt: autoDateField(),
    updatedAt: autoDateField(),
    searchText: searchField(),
    backlog: linkField({ required: false, linkedTo: 'backlog' }),
    name: textField({ required: false }),
    beschreibung: textField({ required: false }),
    status: selectField({
      required: false,
      mode: 'single',
      options: ['Option 1', 'Option 2'] as const,
    }),
    epics: textField({ required: false }),
    table7: textField({ required: false }),
    end: dateField({ required: false }),
    start: dateField({ required: false }),
    sprintStatus: selectField({
      required: false,
      mode: 'single',
      options: [] as const,
    }),
    calendarWeek: textField({ required: false }),
  },
  epics: {
    id: autoNumberField(),
    createdAt: autoDateField(),
    updatedAt: autoDateField(),
    searchText: searchField(),
    backlog: linkField({ required: false, linkedTo: 'backlog' }),
    name: textField({ required: false }),
    status: selectField({
      required: false,
      mode: 'single',
      options: ['Option 1', 'Option 2'] as const,
    }),
    collaborator: linkField({ required: false, linkedTo: 'collaborators' }),
    description: textField({ required: false }),
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
    statusModifiedAt: autoDateField(),
    created: autoDateField(),
    prd: textField({ required: false }),
    countBacklog: numberField({ required: false }),
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
