import {pick} from 'lodash';

export interface AppConfig {
  maxLoan: number;
}

export const defaultConfig: AppConfig = {
  maxLoan: 100,
};

const getConfig = () => {
  const envConfig = pick(process.env, Object.keys(defaultConfig));

  const config = {
    ...defaultConfig,
    ...envConfig,
  };

  return config as AppConfig;
};

export default getConfig;
