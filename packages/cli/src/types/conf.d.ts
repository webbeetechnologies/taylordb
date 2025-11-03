declare module 'conf' {
  class Conf<T extends Record<string, any>> {
    constructor(options: {projectName: string});
    get(key: keyof T): T[keyof T] | undefined;
    set(key: keyof T, value: T[keyof T]): void;
    delete(key: keyof T): void;
  }
  export = Conf;
}
