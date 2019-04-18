/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { EuiIcon } from '@elastic/eui';
import { ViewMode } from 'plugins/embeddable_api/types';
import React from 'react';
import { i18n } from '@kbn/i18n';
import { ExecuteActionContext } from 'plugins/embeddable_api/actions';
import { Action, Container, Embeddable } from '../../../../';
import { getUserData } from './get_user_data';

const CUSTOMIZE_PANEL_ACTION_ID = 'CUSTOMIZE_PANEL_ACTION_ID';

export class CustomizePanelTitleAction extends Action<
  Embeddable,
  Container,
  {},
  {
    title: string | undefined;
  }
> {
  constructor(
    protected getDataFromUser: (
      context: ExecuteActionContext
    ) => Promise<{ title: string | undefined }> = getUserData
  ) {
    super(CUSTOMIZE_PANEL_ACTION_ID);
    this.priority = 8;
  }

  public getTitle() {
    return i18n.translate('kbn.embeddables.panel.customizePanel.displayName', {
      defaultMessage: 'Customize panel',
    });
  }

  public getIcon() {
    return <EuiIcon type="pencil" />;
  }

  public isCompatible({
    embeddable,
    container,
  }: {
    embeddable: Embeddable;
    container?: Container;
  }) {
    return Promise.resolve(
      container && container.getInput().viewMode === ViewMode.EDIT ? true : false
    );
  }

  public async execute({ embeddable, container }: ExecuteActionContext) {
    if (!embeddable || !container) {
      throw new Error(
        'Customize panel title action requires an embeddable and container as context.'
      );
    }

    const customTitle = await this.getDataFromUser({ embeddable, container });
    embeddable.updateInput(customTitle);
  }
}
