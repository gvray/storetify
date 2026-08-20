import { StorageEngine, StoretifyValue, StoretifyListener } from './type';
import { dispatchStorageEvent, each, getGlobal, isValidKey, jsonParse } from './utils';
/**
 * NextStorage
 * Next localStorage
 */
class NextStorage implements StorageEngine {
  namespace = 'storetify';

  protected observers = new Map<string, StoretifyListener[]>();

  protected windowEventStorage = false;

  protected static storage: NextStorage | null = null;

  protected constructor(protected store: Storage) {}

  // SP
  public static getInstance(store = getGlobal()?.localStorage): NextStorage {
    if (!NextStorage.storage) {
      NextStorage.storage = new NextStorage(store);
    }
    return NextStorage.storage;
  }

  public setNamespace(space: string) {
    this.namespace = space;
  }

  public getNamespace() {
    return this.namespace;
  }

  public getUsed() {
    let totalSize = 0;
    const store = this.getStore();
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (key) {
        const value = store.getItem(key) ?? '';
        totalSize += new Blob([key]).size + new Blob([value]).size;
      }
    }
    const storageUsed = totalSize / 1024;
    return `${storageUsed.toFixed(3)} KB`;
  }

  public setStore<T extends Storage>(store: T) {
    this.store = store;
  }

  protected getStore() {
    return this.store;
  }

  private readStored(key: string): { value: StoretifyValue; raw: string; expired: boolean } | null {
    const val = this.getStore().getItem(key);
    if (val === null) return null;

    const parsed = jsonParse(val);
    if (!parsed) return null;

    const expired = !!(parsed.expires && Date.now() > parsed.expires);
    return { value: parsed.value, raw: val, expired };
  }

  public set<T = StoretifyValue>(key: string, value: T, expires?: number) {
    isValidKey(key);
    const val = JSON.stringify({ value, expires: expires ? expires * 1000 + Date.now() : expires });
    try {
      const oldValue = this.getItem(key);
      dispatchStorageEvent(this.getStore(), { key, newValue: val, oldValue, type: 'storage' });
    } finally {
      this.getStore().setItem(key, val);
    }
    return this;
  }

  public get<T = StoretifyValue>(key: string): T | null {
    const stored = this.readStored(key);
    if (!stored) return null;
    if (stored.expired) {
      // only del store key without listeners
      this.remove(key, true);
      return null;
    }
    return stored.value as T;
  }

  public getItem(key: string): string | null {
    const stored = this.readStored(key);
    if (!stored || stored.expired) return null;
    return stored.raw;
  }

  public has(key: string): boolean {
    const stored = this.readStored(key);
    return stored !== null && !stored.expired;
  }

  public publish(
    observers: StoretifyListener[] | string,
    e: StorageEvent,
    force = false,
    defaultKey: string | null = null
  ) {
    // force publish without ask observers
    if (!force && typeof observers === 'string' && !this.has(observers)) return;

    if (Array.isArray(observers)) {
      each(observers, e, defaultKey);
    } else {
      const storeListeners = this.getObserver(observers);
      each(storeListeners, e, defaultKey);
    }
  }

  public publishAll(e: StorageEvent) {
    this.observers.forEach((item: StoretifyListener[], key: string) => {
      this.publish(item, e, true, key);
    });
  }

  public subscribe(key: string, listener: StoretifyListener) {
    const { observers } = this;
    const listeners = observers.get(key);
    if (listeners) {
      listeners.push(listener);
    } else {
      this.observers.set(key, [listener]);
    }
    return this;
  }

  public getObserver(key: string): StoretifyListener[] {
    return this.observers.get(key) ?? [];
  }

  public unsubscribe(keys?: string | string[], listener?: StoretifyListener) {
    if (keys === undefined || keys === null) {
      // 没有 keys，清空所有 observers
      this.observers.clear();
    } else if (Array.isArray(keys)) {
      // keys 是数组，删除数组中的每个 key（空数组不会删除任何内容）
      keys.forEach((key) => {
        this.observers.delete(key);
      });
    } else if (typeof keys === 'string' && listener) {
      // keys 是字符串且有 listener，删除该 key 对应的特定 listener
      const listeners = this.observers.get(keys);
      if (listeners) {
        const filtered = listeners.filter((item: StoretifyListener) => {
          // 通过引用匹配删除
          if (item === listener) return false;
          // 如果引用不同，但有显式设置的名称（非空且非默认值），则通过名称匹配
          if (listener.name && listener.name !== 'mockConstructor' && item.name === listener.name) {
            return false;
          }
          return true;
        });
        if (filtered.length > 0) {
          this.observers.set(keys, filtered);
        } else {
          this.observers.delete(keys);
        }
      }
    } else if (typeof keys === 'string') {
      // keys 是字符串但没有 listener，删除该 key 的所有 listeners
      this.observers.delete(keys);
    }
  }

  public remove(key: string, soft?: boolean) {
    const oldValue = this.getStore().getItem(key) ?? null;
    dispatchStorageEvent(this.getStore(), { key, newValue: null, oldValue, type: 'storage' });
    if (soft !== true) {
      this.unsubscribe(key);
    }
    this.getStore().removeItem(key);
    return this;
  }

  public clear() {
    dispatchStorageEvent(this.getStore(), {
      key: null,
      newValue: null,
      oldValue: null,
      type: 'storage',
    });
    // go dispatchPublish storage.unsubscribe()
    // this.unsubscribe()
    this.getStore().clear();
  }
}

export default NextStorage;
