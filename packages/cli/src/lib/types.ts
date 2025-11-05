export interface AppGetResponse {
  app: {
    get: {
      appDbId: number;
    };
  };
}

export interface BambooField {
  id: number;
  name: string;
  title: string;
  type: string;
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
