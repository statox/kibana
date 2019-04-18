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

import React, { Component } from 'react';

import { EuiFlyoutBody, EuiFlyoutHeader, EuiTitle } from '@elastic/eui';
import { ExecuteActionContext } from 'plugins/embeddable_api/actions';
import { Container, Embeddable } from '../../../../';
import { CustomizeTitleForm } from './customize_title_form';

interface CustomizePanelProps {
  embeddable: Embeddable;
  container: Container;
  originalTitle?: string;
  titleOverride?: string;
  onReset: () => void;
  onUpdatePanelTitle: (newTitle: string) => void;
}

interface State {
  title: string | undefined;
}

export class CustomizePanelFlyout extends Component<CustomizePanelProps, State> {
  constructor(props: CustomizePanelProps) {
    super(props);
    this.state = {
      title: props.container.getInputForEmbeddable(props.embeddable.id).title,
    };
  }

  updateTitle = (title: string | undefined) => {
    this.setState({ title });
  };

  reset = () => {
    this.onUpdatePanelTitle({ title: undefined });
  };

  public render() {
    return (
      <React.Fragment>
        <EuiFlyoutHeader>
          <EuiTitle size="s" data-test-subj="customizePanelTitle">
            <h1>{this.props.titleOverride || this.props.originalTitle}</h1>
          </EuiTitle>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>
          <CustomizeTitleForm
            title={this.state.title || this.props.embeddable.getTitle()}
            onReset={this.reset}
            onUpdatePanelTitle={this.props.onUpdatePanelTitle}
          />
        </EuiFlyoutBody>
      </React.Fragment>
    );
  }
}
