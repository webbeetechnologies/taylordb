import {
  autoNumberField,
  defineTaylorSchema,
  numberField,
  searchField,
  textField,
} from '../index.js';
import type { InferTaylorDatabase } from '../index.js';

export const taylorSchema = defineTaylorSchema({
  selectTable: {
    id: autoNumberField(),
    name: textField({ required: true }),
    color: textField({ required: true }),
  },
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
});

export type TaylorDatabase = InferTaylorDatabase<typeof taylorSchema>;
