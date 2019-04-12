/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { SavedObjectsClient } from 'ui/saved_objects';
import { actionRegistry } from '../../../../../src/legacy/core_plugins/embeddable_api/public';

export async function deleteAction(id: string, savedObjectClient: SavedObjectsClient) {
  savedObjectClient.delete('ui_action', id);

  actionRegistry.removeAction(id);
}
