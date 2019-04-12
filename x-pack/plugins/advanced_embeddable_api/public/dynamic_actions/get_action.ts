/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import chrome from 'ui/chrome';
import { DynamicAction } from './dynamic_action';
import { ActionSavedObjectAttributes } from './action_saved_object';
import { actionFactoryRegistry } from './action_factory_registry';

export async function getAction(
  id: string
): Promise<DynamicAction | { message: string; statusCode?: number }> {
  const savedObjectsClient = chrome.getSavedObjectsClient();
  const response = await savedObjectsClient.get<ActionSavedObjectAttributes>('ui_action', id);
  if (response.error) {
    return Promise.resolve(response.error);
  }

  const factory = actionFactoryRegistry.getFactoryById(response.attributes.type);
  if (!factory) {
    return Promise.resolve({ message: 'Factory not found' });
  } else {
    return factory.fromSavedObject(response);
  }
}
