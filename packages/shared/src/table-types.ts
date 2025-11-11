/**
 * Copyright (c) 2025 TaylorDB
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NumberColumnType, TextColumnType } from './column-types';

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
