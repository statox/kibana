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

jest.mock('ui/metadata', () => ({
  metadata: {
    branch: 'my-metadata-branch',
    version: 'my-metadata-version',
  },
}));

import {
  HELLO_WORLD_EMBEDDABLE,
  HelloWorldEmbeddableFactory,
  HelloWorldContainer,
} from '../__test__/index';
import { EmbeddableFactoryRegistry, isErrorEmbeddable } from '../embeddables';
import {
  HelloWorldEmbeddable,
  HelloWorldInput,
} from '../__test__/embeddables/hello_world_embeddable';
import { ContainerInput } from './container';
import { ViewMode } from '../types';

function createHelloWorldContainer(input: ContainerInput) {
  const embeddableFactories = new EmbeddableFactoryRegistry();
  embeddableFactories.registerFactory(new HelloWorldEmbeddableFactory());
  return new HelloWorldContainer(input, embeddableFactories);
}

test('Container initializes embeddables', async done => {
  const container = createHelloWorldContainer({
    id: 'hello',
    panels: {
      '123': {
        embeddableId: '123',
        initialInput: { name: 'Sam' },
        type: HELLO_WORLD_EMBEDDABLE,
      },
    },
  });

  container.subscribeToOutputChanges(output => {
    if (container.getOutput().embeddableLoaded['123']) {
      const embeddable = container.getEmbeddable<HelloWorldEmbeddable>('123');
      expect(embeddable).toBeDefined();
      expect(embeddable.id).toBe('123');
      done();
    }
  });

  if (container.getOutput().embeddableLoaded['123']) {
    const embeddable = container.getEmbeddable<HelloWorldEmbeddable>('123');
    expect(embeddable).toBeDefined();
    expect(embeddable.id).toBe('123');
    done();
  }
});

test('Container.addNewEmbeddable', async () => {
  const container = createHelloWorldContainer({ id: 'hello', panels: {} });
  const embeddable = await container.addNewEmbeddable<HelloWorldInput>(HELLO_WORLD_EMBEDDABLE, {
    firstName: 'Kibana',
  });
  expect(embeddable).toBeDefined();

  if (!isErrorEmbeddable(embeddable)) {
    expect(embeddable.getInput().firstName).toBe('Kibana');
  } else {
    expect(false).toBe(true);
  }

  const embeddableInContainer = container.getEmbeddable<HelloWorldEmbeddable>(embeddable.id);
  expect(embeddableInContainer).toBeDefined();
  expect(embeddableInContainer.id).toBe(embeddable.id);
});

describe('Container.removeEmbeddable', async () => {
  const container = createHelloWorldContainer({
    id: 'hello',
    panels: {
      '123': {
        embeddableId: '123',
        initialInput: { name: 'Sam' },
        type: HELLO_WORLD_EMBEDDABLE,
      },
    },
  });

  const embeddable = await container.addNewEmbeddable<HelloWorldInput, HelloWorldEmbeddable>(
    HELLO_WORLD_EMBEDDABLE,
    {
      firstName: 'Kibana',
    }
  );

  test('Removes the embeddable', async () => {
    if (isErrorEmbeddable(embeddable)) {
      expect(false).toBe(true);
      return;
    }

    embeddable.getDoctorate();

    embeddable.destroy = jest.fn();

    container.removeEmbeddable(embeddable.id);

    const noFind = container.getEmbeddable<HelloWorldEmbeddable>(embeddable.id);
    expect(noFind).toBeUndefined();
  });

  test('calls the embeddables destroy fn', async () => {
    expect(embeddable.destroy).toBeCalled();
  });

  test('Remove the embeddable panel state', async () => {
    expect(container.getInput().panels[embeddable.id]).toBeUndefined();
  });

  test('unsubscribes from embeddable changes', async () => {
    if (isErrorEmbeddable(embeddable)) {
      expect(false).toBe(true);
      return;
    }
    const changes = jest.fn();
    const unsubcribe = container.subscribeToChanges(changes);
    embeddable.loseDoctorate();
    expect(changes).toBeCalledTimes(0);
    unsubcribe();
  });
});

test('Container.subscribeToChanges is called when child embeddable input is updated', async () => {
  const container = createHelloWorldContainer({ id: 'hello', panels: {} });
  const embeddable = await container.addNewEmbeddable<HelloWorldInput, HelloWorldEmbeddable>(
    HELLO_WORLD_EMBEDDABLE,
    {
      firstName: 'Kibana',
    }
  );

  if (isErrorEmbeddable(embeddable)) {
    expect(false).toBe(true);
    return;
  }

  const changes = jest.fn();
  const unsubcribe = container.subscribeToChanges(changes);

  embeddable.getDoctorate();

  expect(changes).toBeCalledTimes(1);

  expect(embeddable.getInput().title === 'Dr.');

  embeddable.loseDoctorate();

  expect(embeddable.getInput().title === '');

  expect(changes).toBeCalledTimes(2);

  unsubcribe();

  embeddable.getDoctorate();

  expect(changes).toBeCalledTimes(2);
});

test('Container.subscribeToInputChanges', async () => {
  const container = createHelloWorldContainer({ id: 'hello', panels: {} });
  const embeddable = await container.addNewEmbeddable<HelloWorldInput, HelloWorldEmbeddable>(
    HELLO_WORLD_EMBEDDABLE,
    {
      firstName: 'Joe',
    }
  );

  if (isErrorEmbeddable(embeddable)) {
    expect(false).toBe(true);
    return;
  }

  const changes = jest.fn();
  const input = container.getInput();
  expect(input.panels[embeddable.id].initialInput).toEqual({ firstName: 'Joe' });

  const unsubcribe = container.subscribeToInputChanges(changes);
  embeddable.getDoctorate();

  const expectedChanges: Partial<ContainerInput> = {
    id: container.id,
    panels: {
      ...input.panels,
      [embeddable.id]: {
        ...input.panels[embeddable.id],
        initialInput: {
          firstName: 'Joe',
          title: 'Dr.',
        },
      },
    },
  };
  expect(changes).toBeCalledWith(expectedChanges);
  expect(container.getInput().panels[embeddable.id].initialInput).toEqual({
    title: 'Dr.',
    firstName: 'Joe',
  });
  unsubcribe();
});

test('Container.subscribeToInputChanges not triggered if state is the same', async () => {
  const container = createHelloWorldContainer({ id: 'hello', panels: {} });
  const embeddable = await container.addNewEmbeddable<HelloWorldInput, HelloWorldEmbeddable>(
    HELLO_WORLD_EMBEDDABLE,
    {
      firstName: 'Joe',
    }
  );

  if (isErrorEmbeddable(embeddable)) {
    expect(false).toBe(true);
    return;
  }

  const changes = jest.fn();
  const input = container.getInput();
  expect(input.panels[embeddable.id].initialInput).toEqual({ firstName: 'Joe' });
  const unsubcribe = container.subscribeToInputChanges(changes);
  embeddable.getDoctorate();
  expect(changes).toBeCalledTimes(1);
  embeddable.getDoctorate();
  expect(changes).toBeCalledTimes(1);
  unsubcribe();
});

test('Container view mode change propagates to children', async () => {
  const container = createHelloWorldContainer({ id: 'hello', panels: {}, viewMode: ViewMode.VIEW });
  const embeddable = await container.addNewEmbeddable<HelloWorldInput, HelloWorldEmbeddable>(
    HELLO_WORLD_EMBEDDABLE,
    {
      firstName: 'Joe',
    }
  );

  expect(embeddable.getInput().viewMode).toBe(ViewMode.VIEW);

  container.updateInput({ viewMode: ViewMode.EDIT });

  expect(embeddable.getInput().viewMode).toBe(ViewMode.EDIT);
});
