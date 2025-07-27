import { StoretifyValue, StoreListener } from "./type"
import { dispatchStorageEvent, each, getGlobal, isValidKey, jsonParse } from "./utils"
/**
 * NextStorage
 * Next localStorage
 */
class NextStorage {
  namespace = "storetify"

  protected observers = new Map()

  protected windowEventStorage = false

  // eslint-disable-next-line no-use-before-define
  protected static storage: NextStorage | null = null

  // eslint-disable-next-line no-useless-constructor
  protected constructor(protected store: Storage) {}

  // SP
  public static getInstance(store = getGlobal()?.localStorage): NextStorage {
    if (!NextStorage.storage) {
      NextStorage.storage = new NextStorage(store)
    }
    return NextStorage.storage
  }

  public setNamespace(space: string) {
    this.namespace = space
  }

  public getNamespace() {
    return this.namespace
  }

  public getUsed() {
    const storageUsed = JSON.stringify(this.getStore()).length / 1024
    return `${storageUsed.toFixed(3)} KB`
  }

  public setStore<T extends Storage>(store: T) {
    this.store = store
  }

  protected getStore() {
    return this.store
  }

  public set<T = StoretifyValue>(key: string, value: T, expires?: number) {
    isValidKey(key)
    const val = JSON.stringify({ value, expires: expires ? expires * 1000 + Date.now() : expires })
    try {
      const oldValue = this.getItem(key)
      dispatchStorageEvent({ key, newValue: val, oldValue, type: "storage" })
    } finally {
      this.getStore().setItem(key, val)
    }
    return this
  }

  public get<T = StoretifyValue>(key: string): T | null {
    const val = this.getStore().getItem(key) ?? null
    if (val === null) {
      return val
    }
    const value = jsonParse(val)
    if (!value.expires || Date.now() <= value.expires) {
      return value.value
    }
    // only del store key without listeners
    this.remove(key, true)
    return null
  }

  public getItem(key: string): string | null {
    const val = this.getStore().getItem(key) ?? null
    if (val === null) {
      return val
    }
    const value = jsonParse(val)
    if (!value.expires || Date.now() <= value.expires) {
      return val
    }
    // this.remove(key) only read value
    return null
  }

  public has(key: string): boolean {
    const val = this.getStore().getItem(key)
    if (val === null) return false
    return true
  }

  public publish(
    observers: StoreListener[] | string,
    e: StorageEvent,
    force = false,
    defaultKey: string | null = null,
  ) {
    // force publish without ask observers
    if (!observers && !force && !this.has(observers)) return

    if (Array.isArray(observers)) {
      each(observers, e, defaultKey)
    } else {
      const storeListeners = this.getObserver(observers)
      each(storeListeners, e, defaultKey)
    }
  }

  public publishAll(e: StorageEvent) {
    this.observers.forEach((item: StoreListener[], key: string) => {
      this.publish(item, e, true, key)
    })
  }

  public subscribe(key: string, listener: StoreListener) {
    const { observers } = this
    const listeners = observers.get(key)
    if (listeners) {
      listeners.push(listener)
      // this.observers.set(key, listeners)
    } else {
      this.observers.set(key, [listener])
    }
    return this
  }

  public getObserver(key: string): StoreListener[] {
    return this.observers.get(key) ?? []
  }

  public unsubscribe(keys?: string | string[], listener?: StoreListener) {
    if (Array.isArray(keys)) {
      keys.forEach(key => {
        this.observers.delete(key)
      })
    } else if (typeof keys === "string" && listener) {
      let listeners = this.observers.get(keys)
      if (listener.name && listeners) {
        listeners = listeners.filter((item: StoreListener) => item.name !== listener.name)
        this.observers.set(keys, listeners)
      }
    } else if (typeof keys === "string") {
      this.observers.delete(keys)
    } else {
      this.observers.clear()
    }
  }

  public remove(key: string, soft?: boolean) {
    const oldValue = this.getStore().getItem(key) ?? null
    dispatchStorageEvent({ key, newValue: null, oldValue, type: "storage" })
    if (soft !== true) {
      this.unsubscribe(key)
    }
    this.getStore().removeItem(key)
    return this
  }

  public clear() {
    dispatchStorageEvent({ key: null, newValue: null, oldValue: null, type: "storage" })
    // go dispatchPublish storage.unsubscribe()
    // this.unsubscribe()
    this.getStore().clear()
  }
}

export default NextStorage
