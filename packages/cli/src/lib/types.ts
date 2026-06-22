import type { BambooFieldsType } from '@taylordb/query-builder';

export interface AppGetResponse {
  server: {
    getBaseById: {
      baseDbId: string;
    };
  };
}

export interface BambooField {
  id: number;
  name: string;
  title: string;
  type: BambooFieldsType | string;
  options: any;
  returnType: string;
}

export interface BambooModel {
  id: number;
  name: string;
  title: string;
  slug: string;
  fields: BambooField[];
}

export interface BambooModelsResponse {
  bambooModels: {
    records: BambooModel[];
  };
}

export interface PluginAction {
  name: string;
  description: string;
  inputSchema?: any;
  outputSchema?: any;
}

export interface BambooPlugin {
  id: string;
  name: string;
  type: string;
  actions: PluginAction[];
}

export interface BambooPluginsResponse {
  bambooPlugins: {
    records: BambooPlugin[];
  };
}
