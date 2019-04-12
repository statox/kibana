/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { SimpleSavedObject } from 'ui/saved_objects';
import { SavedObjectAttributes } from 'src/legacy/server/saved_objects';

export interface ActionSavedObjectAttributes extends SavedObjectAttributes {
  description: string;
  configuration: string;
  type: string;
  title: string;
  embeddableType: string;
  embeddableId: string;
  embeddableTemplateMapping: string;
}

export type ActionSavedObject = SimpleSavedObject<ActionSavedObjectAttributes>;
