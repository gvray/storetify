import { StoretifyValueOrNull, StoretifyListener, StoretifyEvent } from './type';

const BIND_FLAG = Symbol.for('__storetify_bind_window_event_flag__');

export function getGlobal(): any {
  if (typeof globalThis !== 'undefined') return globalThis;
  if (typeof window !== 'undefined') return window;

  if (typeof self !== 'undefined') return self;
  if (typeof global !== 'undefined') return global;
  return undefined;
}

export function hasBindWindowEventStorage(): boolean {
  return !!(getGlobal() as any)[BIND_FLAG];
}

export function setBindWindowEventStorage(flag: boolean) {
  (getGlobal() as any)[BIND_FLAG] = flag;
}

export function dispatchStorageEvent(
  storage: Storage,
  { key, newValue, oldValue, type }: Pick<StorageEvent, 'key' | 'newValue' | 'oldValue' | 'type'>
) {
  const init: StorageEventInit = {
    key,
    newValue,
    oldValue,
    url: getGlobal()?.location?.href,
  };

  let naturalStorageEvent: StorageEvent;
  try {
    naturalStorageEvent = new StorageEvent(type, {
      ...init,
      storageArea: storage,
    });
  } catch {
    // 自定义 storage 可能不是原生 Storage 实例，此时不带 storageArea 兜底派发
    naturalStorageEvent = new StorageEvent(type, init);
  }

  getGlobal()?.dispatchEvent(naturalStorageEvent);
}

export function jsonParse(data: string | null) {
  if (data === null || data === 'undefined' || data === undefined) {
    return null;
  }
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function each(funcs: StoretifyListener[], ev: StorageEvent, defaultKey: string | null) {
  let newValue: StoretifyValueOrNull = null;
  let oldValue: StoretifyValueOrNull = null;
  try {
    newValue = jsonParse(ev.newValue)?.value ?? newValue;
    oldValue = jsonParse(ev.oldValue)?.value ?? oldValue;
  } catch (error) {
    console.warn(`has an exception in your json parse, from ${ev.url}, .eg ${error}`);
  }
  const mutationalStorageEvent = {
    type: ev.type,
    key: ev.key === null ? defaultKey : ev.key,
    newValue,
    oldValue,
    url: ev.url,
    isTrusted: ev.isTrusted,
    native: ev,
  } as StoretifyEvent;

  funcs.forEach((func: StoretifyListener) => {
    if (typeof func === 'function') {
      try {
        func(mutationalStorageEvent);
      } catch (error) {
        console.warn(`has an exception in your ${func.name || 'anonymous function'}( ev ){
          ${error}
        }`);
      }
    }
  });
}

export function isValidKey(key: unknown): asserts key is string {
  if (typeof key !== 'string') {
    throw new TypeError('store key must be a string');
  }
}

export default {
  dispatchStorageEvent,
  jsonParse,
  each,
  getGlobal,
};
