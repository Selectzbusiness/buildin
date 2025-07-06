import Cookies from 'js-cookie';

export const cookieStorage = {
  getItem: (key: string) => Cookies.get(key) ?? null,
  setItem: (key: string, value: string) => { Cookies.set(key, value, { sameSite: 'Lax' }); },
  removeItem: (key: string) => { Cookies.remove(key); },
}; 