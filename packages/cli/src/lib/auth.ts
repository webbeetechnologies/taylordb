// @ts-ignore
import Conf from 'conf';

const config = new Conf({ projectName: 'taylordb' });

export function setToken(token: string) {
  config.set('accessToken', token);
}

export function getToken(): string | unknown {
  return config.get('accessToken');
}

export function clearToken() {
  config.delete('accessToken');
}
