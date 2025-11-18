import {
  MetadataWithTableName,
  UpdateMutationMetaData,
} from '@taylordb/shared';
import { AnyDB } from './internal-types';

export type UpdateNode = MetadataWithTableName<UpdateMutationMetaData>;

type NotUpdatableKeys<T extends AnyDB[string]> = {
  [K in keyof T]: T[K]['update'] extends never ? K : never;
}[keyof T];

export type Updatable<T extends AnyDB[string]> = {
  [K in keyof Omit<T, NotUpdatableKeys<T>>]?: T[K]['update'];
};
