/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import React from 'react';
import { EuiIcon } from '@elastic/eui';
import {
  Container,
  ContainerInput,
  Embeddable,
  TimeRange,
  PanelState,
  EmbeddableInput,
} from '../../../../../src/legacy/core_plugins/embeddable_api/public';

import { APPLY_TIME_RANGE } from './apply_time_range_factory';
import { DynamicAction } from '../dynamic_actions';
import { SerializedDynamicAction } from '../dynamic_actions/action_saved_object';

interface TimeRangeEmbeddableInput extends EmbeddableInput {
  timeRange?: TimeRange;
}

export class ApplyTimeRangeAction extends DynamicAction {
  public timeRange?: TimeRange;

  constructor(actionSavedObject?: SerializedDynamicAction) {
    super({ actionSavedObject, type: APPLY_TIME_RANGE });
    if (
      actionSavedObject &&
      actionSavedObject.configuration &&
      actionSavedObject.configuration !== ''
    ) {
      this.timeRange = JSON.parse(actionSavedObject.configuration);
    }
  }

  public getConfiguration() {
    return JSON.stringify(this.timeRange);
  }

  public getTitle() {
    if (!this.timeRange) return 'Inherit from dashboard';
    if (this.timeRange.from === 'now/y' && this.timeRange.to === 'now/y') {
      return 'This year';
    }
    if (this.timeRange.from === 'now/M' && this.timeRange.to === 'now/M') {
      return 'This month';
    }
    if (this.timeRange.from === 'now-15m' && this.timeRange.to === 'now') {
      return 'Last fifteen minutes';
    }
    return `${this.timeRange.from} to ${this.timeRange.to}`;
  }

  public getIcon({ embeddable, container }: { embeddable: Embeddable; container: Container }) {
    const input = container.getExplicitEmbeddableInput(embeddable.id);
    if (!this.timeRange && input.timeRange === undefined) {
      return <EuiIcon type="check" />;
    }

    if (input.timeRange && _.isEqual(this.timeRange, input.timeRange)) {
      return <EuiIcon type="check" />;
    }

    return <div />;
  }

  public allowTemplateMapping() {
    return false;
  }

  public execute({ embeddable, container }: { embeddable: Embeddable; container: Container }) {
    if (!embeddable || !container) {
      return;
    }
    container.updateEmbeddableInput<TimeRangeEmbeddableInput>(embeddable.id, {
      timeRange: this.timeRange,
    });
  }
}
