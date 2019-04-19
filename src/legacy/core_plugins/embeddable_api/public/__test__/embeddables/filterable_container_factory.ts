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

import { embeddableFactories, EmbeddableFactory } from 'plugins/embeddable_api/index';
import { Container } from 'plugins/embeddable_api/containers';
import {
  FilterableContainer,
  FilterableContainerInput,
  FILTERABLE_CONTAINER,
} from './filterable_container';

export class FilterableContainerFactory extends EmbeddableFactory<FilterableContainerInput> {
  constructor() {
    super({
      name: FILTERABLE_CONTAINER,
    });
  }

  public getOutputSpec() {
    return {};
  }

  public create(initialInput: FilterableContainerInput, parent?: Container) {
    console.log('FilterableContainerFactory: input is ', initialInput);
    return Promise.resolve(new FilterableContainer(initialInput, embeddableFactories, parent));
  }
}

embeddableFactories.registerFactory(new FilterableContainerFactory());
