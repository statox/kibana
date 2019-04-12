/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import uuid from 'uuid';
import { ActionSavedObject, ActionSavedObjectAttributes } from './action_saved_object';

import { flatten } from './flatten';
import {
  Action,
  Embeddable,
  Container,
} from '../../../../../src/legacy/core_plugins/embeddable_api/public';

export interface ExecuteActionContext<
  E extends Embeddable = Embeddable,
  C extends Container = Container,
  AC extends {} = {}
> {
  embeddable: E;
  container?: C;
  triggerContext?: AC;
}

export interface ActionContext<E extends Embeddable = Embeddable, C extends Container = Container> {
  embeddable: E;
  container?: C;
}

export abstract class DynamicAction extends Action {
  // If specified, this action is compatible with only the given instance id.
  public embeddableId: string = '';

  // The type of action this is, indicates the factory used to create an
  // instance.
  public readonly type: string;

  public title: string;

  public description: string = '';

  public configuration: string = '';

  public embeddableTemplateMapping: { [key: string]: string } = {};

  constructor({
    type,
    actionSavedObject,
  }: {
    type: string;
    actionSavedObject?: ActionSavedObject;
  }) {
    super(actionSavedObject ? actionSavedObject.id : uuid.v4());
    this.title = actionSavedObject ? actionSavedObject.attributes.title : 'New action';
    this.type =
      actionSavedObject && actionSavedObject.attributes.type
        ? actionSavedObject.attributes.type
        : type;
    if (actionSavedObject) {
      this.embeddableId = actionSavedObject.attributes.embeddableId;
      this.embeddableType = actionSavedObject.attributes.embeddableType;
      if (
        actionSavedObject.attributes.embeddableTemplateMapping &&
        actionSavedObject.attributes.embeddableTemplateMapping !== ''
      ) {
        this.embeddableTemplateMapping = JSON.parse(
          actionSavedObject.attributes.embeddableTemplateMapping
        );
      }
    }
  }

  public getTitle(context: ActionContext) {
    return this.title;
  }

  public isSingleton() {
    return false;
  }

  public allowDynamicTriggerMapping() {
    return true;
  }

  public isCompatible({ embeddable }: ActionContext): Promise<boolean> {
    if (this.embeddableId !== '') {
      return Promise.resolve(!!embeddable && embeddable.id === this.embeddableId);
    } else if (this.embeddableType !== '') {
      return Promise.resolve(!!embeddable && embeddable.type === this.embeddableType);
    } else {
      return Promise.resolve(true);
    }
  }

  public abstract execute(context: ExecuteActionContext): void;

  public allowTemplateMapping() {
    return true;
  }

  public allowEditing() {
    return true;
  }

  public getSavedObjectAttributes(): ActionSavedObjectAttributes {
    return {
      title: this.title,
      embeddableType: this.embeddableType,
      type: this.type || '',
      embeddableId: this.embeddableId,
      description: this.description,
      configuration: this.getConfiguration(),
      embeddableTemplateMapping: this.mappingToString(),
    };
  }

  public updateConfiguration(configuration: string) {
    this.configuration = configuration;
  }

  public getConfiguration() {
    return this.configuration;
  }

  public mappingToString() {
    return JSON.stringify(this.embeddableTemplateMapping);
  }

  public mappingFromString(mapping: string) {
    this.embeddableTemplateMapping = JSON.parse(mapping);
  }

  protected injectTemplateParameters<E extends Embeddable>(
    template: string,
    embeddable?: E,
    triggerContext?: { [key: string]: any }
  ) {
    let output = template;
    const mapping = this.embeddableTemplateMapping;

    const embeddableOutput = embeddable ? { ...embeddable.getOutput() } : {};

    const flattenedEmbeddableOutput = flatten(embeddableOutput, 'element.');
    const flattenedTriggerContext = flatten(triggerContext || {}, 'triggerContext.');
    const flattenedOutput: { [key: string]: any } = {
      ...flattenedEmbeddableOutput,
      ...flattenedTriggerContext,
    };

    Object.keys(mapping).forEach(name => {
      const path = mapping[name];
      const replaceValue = `\$\{${name}\}`;
      output = output.replace(replaceValue, flattenedOutput[path]);
    });
    return output;
  }
}
