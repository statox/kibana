/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import {
  actionRegistry,
  triggerRegistry,
} from '../../../../../src/legacy/core_plugins/embeddable_api/public';
import { getActions } from './get_actions';
import { getActionIdsForTrigger } from './dynamic_trigger_action_mappings';

export async function seedActionRegistry() {
  const actions = await getActions();
  actions.forEach(action => actionRegistry.addAction(action));
}

export async function seedTriggerRegistry() {
  const triggers = triggerRegistry.getTriggers();
  const promises = triggers.map(async trigger => {
    const actionIds = await getActionIdsForTrigger(trigger.id);
    actionIds.forEach(actionId => {
      triggerRegistry.attachAction({
        actionId,
        triggerId: trigger.id,
      });
    });
  });

  await Promise.all(promises);
}

seedActionRegistry();
seedTriggerRegistry();
