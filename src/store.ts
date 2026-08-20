import NextStorage from './NextStorage';
import {
  Storetify,
  StoretifyApi,
  StoretifyArgs,
  StoretifyListener,
  StoretifySetter,
  StoretifyValue,
  StoretifyValueOrNull,
} from './type';
import { hasBindWindowEventStorage, setBindWindowEventStorage } from './utils';

const storage = NextStorage.getInstance();

function resolveStoreValue<T = StoretifyValue>(
  value: StoretifyValueOrNull<T> | StoretifySetter<T>
): StoretifyValueOrNull<T> {
  return typeof value === 'function' ? (value as StoretifySetter<T>)() : value;
}

function storeImpl<T = StoretifyValue>(key: string): T | null;
function storeImpl<T extends StoretifyValue>(
  key: string,
  value: T | StoretifySetter<T>,
  expires?: number
): StoretifyApi;
function storeImpl(...rest: StoretifyArgs): StoretifyValue | null | StoretifyApi {
  const len = rest.length;
  const [key, value, expires] = rest;
  if (len === 1 && typeof key === 'string') {
    return storage.get(key);
  }
  if (len >= 2 && typeof key === 'string') {
    if (value === undefined) {
      storage.remove(key);
      return store;
    }
    storage.set(key, resolveStoreValue(value as StoretifyValueOrNull | StoretifySetter), expires);
    return store;
  }
  return null;
}

const store = storeImpl as Storetify;

function init(): Storetify {
  const skipNames = ['constructor', 'getStore', 'set', 'remove', 'subscribe'];
  const propertyNames = Object.getOwnPropertyNames(Object.getPrototypeOf(storage));
  propertyNames.forEach((key) => {
    if (skipNames.includes(key)) return;
    const value = storage[key as keyof NextStorage];
    const storeKey = key as keyof Storetify;
    if (typeof value === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (store as Record<string, any>)[storeKey] = value.bind(storage);
    }
  });

  // set 需要单独处理：支持惰性求值函数，对外返回 StoretifyApi
  store.set = <T = StoretifyValue>(
    key: string,
    value: StoretifyValueOrNull<T> | StoretifySetter<T>,
    expires?: number
  ): StoretifyApi => {
    const actualValue = resolveStoreValue(value);
    storage.set(key, actualValue, expires);
    return store;
  };

  // remove / subscribe 底层返回 StorageEngine，但对外要返回 StoretifyApi
  store.remove = (key: string, soft?: boolean): StoretifyApi => {
    storage.remove(key, soft);
    return store;
  };

  store.subscribe = (key: string, listener: StoretifyListener): StoretifyApi => {
    storage.subscribe(key, listener);
    return store;
  };

  Object.defineProperty(store, 'storage', {
    value: storage,
    writable: false,
    configurable: false,
    enumerable: false,
  });

  function dispatchPublish(ev: StorageEvent) {
    const { key, newValue, oldValue, isTrusted } = ev;
    if (key !== null && newValue !== oldValue) {
      storage.publish(key, ev, true);
      return;
    }
    if (key === null && newValue === null && oldValue === null) {
      storage.publishAll(ev);
      // Consistent behavior with storage.clear(), while unsubscribe.
      if (isTrusted !== true) {
        storage.unsubscribe();
      }
    }
  }

  // SP
  if (!hasBindWindowEventStorage()) {
    setBindWindowEventStorage(true);

    const handleStorageChange = (e: StorageEvent) => {
      dispatchPublish(e);
    };

    window.addEventListener('storage', handleStorageChange);
  }

  return store;
}

export default init();
