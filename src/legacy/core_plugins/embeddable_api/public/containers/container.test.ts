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
import { nextTick } from 'test_utils/enzyme_helpers';

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
        partialInput: { name: 'Sam' },
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

test('Container.removeEmbeddable removes and cleans up', async () => {
  const container = createHelloWorldContainer({
    id: 'hello',
    panels: {
      '123': {
        embeddableId: '123',
        partialInput: { name: 'Sam' },
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

  if (isErrorEmbeddable(embeddable)) {
    expect(false).toBe(true);
    return;
  }

  embeddable.graduateWithPhd();

  container.removeEmbeddable(embeddable.id);

  const noFind = container.getEmbeddable<HelloWorldEmbeddable>(embeddable.id);
  expect(noFind).toBeUndefined();

  expect(container.getInput().panels[embeddable.id]).toBeUndefined();
  if (isErrorEmbeddable(embeddable)) {
    expect(false).toBe(true);
    return;
  }

  expect(embeddable.loseDoctorate).toThrowError();
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

  embeddable.graduateWithPhd();

  expect(changes).toBeCalledTimes(1);

  expect(embeddable.getInput().nameTitle === 'Dr.');

  embeddable.loseDoctorate();

  expect(embeddable.getInput().nameTitle === '');

  expect(changes).toBeCalledTimes(2);

  unsubcribe();

  embeddable.graduateWithPhd();

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
  expect(input.panels[embeddable.id].partialInput).toEqual({ firstName: 'Joe' });

  const unsubcribe = container.subscribeToInputChanges(changes);
  embeddable.graduateWithPhd();

  const expectedChanges: Partial<ContainerInput> = {
    panels: {
      ...input.panels,
      [embeddable.id]: {
        ...input.panels[embeddable.id],
        partialInput: {
          firstName: 'Joe',
          nameTitle: 'Dr.',
        },
      },
    },
  };
  expect(changes).toBeCalledWith(expectedChanges);
  expect(container.getInput().panels[embeddable.id].partialInput).toEqual({
    nameTitle: 'Dr.',
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
  expect(input.panels[embeddable.id].partialInput).toEqual({ firstName: 'Joe' });
  const unsubcribe = container.subscribeToInputChanges(changes);
  embeddable.graduateWithPhd();
  expect(changes).toBeCalledTimes(1);
  embeddable.graduateWithPhd();
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

test(`Container updates its state when a child's input is updated`, async () => {
  const container = createHelloWorldContainer({ id: 'hello', panels: {}, viewMode: ViewMode.VIEW });
  const embeddable = await container.addNewEmbeddable<HelloWorldInput, HelloWorldEmbeddable>(
    HELLO_WORLD_EMBEDDABLE,
    {
      firstName: 'Joe',
    }
  );

  if (isErrorEmbeddable(embeddable)) {
    throw new Error('Error adding embeddable');
  }

  embeddable.graduateWithPhd();

  const newContainer = createHelloWorldContainer(container.getInput());

  newContainer.subscribeToOutputChanges(() => {
    const newEmbeddable = newContainer.getEmbeddable<HelloWorldEmbeddable>(embeddable.id);
    expect(newEmbeddable.getInput().title).toBe('Dr.');
  });
});

test(`Derived container state passed to children`, async () => {
  const container = createHelloWorldContainer({ id: 'hello', panels: {}, viewMode: ViewMode.VIEW });
  const embeddable = await container.addNewEmbeddable<HelloWorldInput, HelloWorldEmbeddable>(
    HELLO_WORLD_EMBEDDABLE,
    {
      firstName: 'Joe',
    }
  );

  let unsubscribe = embeddable.subscribeToInputChanges((changes: Partial<HelloWorldInput>) => {
    expect(changes.viewMode).toBe(ViewMode.EDIT);
  });
  container.updateInput({ viewMode: ViewMode.EDIT });

  unsubscribe();
  unsubscribe = embeddable.subscribeToInputChanges((changes: Partial<HelloWorldInput>) => {
    expect(changes.viewMode).toBe(ViewMode.VIEW);
  });
  container.updateInput({ viewMode: ViewMode.VIEW });
  unsubscribe();
});

test(`Can subscribe to children embeddable updates`, async done => {
  const container = createHelloWorldContainer({
    id: 'hello container',
    panels: {},
    viewMode: ViewMode.VIEW,
  });
  const embeddable = await container.addNewEmbeddable<HelloWorldInput, HelloWorldEmbeddable>(
    HELLO_WORLD_EMBEDDABLE,
    {
      firstName: 'Joe',
    }
  );

  if (isErrorEmbeddable(embeddable)) {
    throw new Error('Error adding embeddable');
  }

  const unsubscribe = embeddable.subscribeToInputChanges(changes => {
    expect(changes.nameTitle).toBe('Dr.');
    unsubscribe();
    done();
  });
  embeddable.graduateWithPhd();
});

test('Test nested reactions', async done => {
  const container = createHelloWorldContainer({ id: 'hello', panels: {}, viewMode: ViewMode.VIEW });
  const embeddable = await container.addNewEmbeddable<HelloWorldInput, HelloWorldEmbeddable>(
    HELLO_WORLD_EMBEDDABLE,
    {
      firstName: 'Joe',
    }
  );

  if (isErrorEmbeddable(embeddable)) {
    throw new Error('Error adding embeddable');
  }

  const unsubscribe = embeddable.subscribeToInputChanges(() => {
    container.updateInput({ viewMode: ViewMode.EDIT });
  });

  let iteration = 1;
  const unsubcribeContainer = container.subscribeToInputChanges(changes => {
    if (iteration === 1) {
      // The title should still be empty at this point, only the parent can push changes
      // to the child.
      expect(embeddable.getInput().title).toBeUndefined();
      // The container has been told to push an update to its child.
      const newChildTitle = changes.panels && changes.panels[embeddable.id].partialInput.nameTitle;
      expect(newChildTitle).toBe('Dr.');
      iteration++;
    } else if (iteration === 2) {
      expect(changes.viewMode).toBe(ViewMode.EDIT);
      unsubcribeContainer();
      unsubscribe();
      done();
      return;
    }
  });

  embeddable.graduateWithPhd();
});
