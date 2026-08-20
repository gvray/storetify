import { StoretifyListener, StoretifyEvent } from './type';

declare const process: { env: { NODE_ENV?: string } } | undefined;

const BIND_FLAG = Symbol.for('__storetify_bind_window_event_flag__');

export function getGlobal(): typeof globalThis | undefined {
  if (typeof globalThis !== 'undefined') return globalThis;
  if (typeof window !== 'undefined') return window;
  if (typeof self !== 'undefined') return self;

  // global is Node-only; access via globalThis to avoid missing identifier in browser-only types
  const globalObj = globalThis as typeof globalThis & { global?: typeof globalThis };
  if (typeof globalObj.global !== 'undefined') return globalObj.global;
  return undefined;
}

export function hasBindWindowEventStorage(): boolean {
  const globalObj = getGlobal() as Record<symbol, boolean> | undefined;
  return globalObj ? !!globalObj[BIND_FLAG] : false;
}

export function setBindWindowEventStorage(flag: boolean) {
  const globalObj = getGlobal() as Record<symbol, boolean> | undefined;
  if (globalObj) {
    globalObj[BIND_FLAG] = flag;
  }
}

export function dispatchStorageEvent(
  storage: Storage,
  { key, newValue, oldValue, type }: Pick<StorageEvent, 'key' | 'newValue' | 'oldValue' | 'type'>
) {
  const init: StorageEventInit = {
    key,
    newValue,
    oldValue,
    url: getGlobal()?.location?.href ?? '',
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

export function jsonParse(data: string | null | undefined) {
  if (data === null || data === 'undefined' || data === undefined) {
    return null;
  }
  try {
    return JSON.parse(data);
  } catch (error) {
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      const preview =
        typeof data === 'string' && data.length > 100 ? `${data.slice(0, 100)}...` : data;
      console.warn(`[storetify] jsonParse failed: ${error}, data: ${preview}`);
    }
    return null;
  }
}

export function notifyListeners(
  funcs: StoretifyListener[],
  ev: StorageEvent,
  defaultKey: string | null
) {
  const newValue = jsonParse(ev.newValue)?.value ?? null;
  const oldValue = jsonParse(ev.oldValue)?.value ?? null;
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
  notifyListeners,
  getGlobal,
};
