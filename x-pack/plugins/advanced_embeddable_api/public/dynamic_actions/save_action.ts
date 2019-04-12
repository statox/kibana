/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import chrome from 'ui/chrome';
import { DynamicAction } from './dynamic_action';
import { addAction } from './add_action';

import { actionRegistry } from '../../../../../src/legacy/core_plugins/embeddable_api/public';

export async function saveAction(action: DynamicAction) {
  if (!action.id) {
    const newAction = await addAction(action);
    actionRegistry.addAction(newAction);
    return newAction;
  } else {
    chrome
      .getSavedObjectsClient()
      .update('ui_action', action.id, action.getSavedObjectAttributes());
    actionRegistry.removeAction(action.id);
    actionRegistry.addAction(action);
    return action;
  }
}
