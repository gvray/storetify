import { StoretifyEventValue, StoreListener, StoretifyEvent } from "./type"

const BIND_FLAG = Symbol.for("__storetify_bind_window_event_flag__")

export function getGlobal(): any {
  if (typeof globalThis !== "undefined") return globalThis
  if (typeof window !== "undefined") return window
  // eslint-disable-next-line no-restricted-globals
  if (typeof self !== "undefined") return self
  if (typeof global !== "undefined") return global
  return undefined
}

export function hasBindWindowEventStorage(): boolean {
  return !!(getGlobal() as any)[BIND_FLAG]
}

export function setBindWindowEventStorage(flag: boolean) {
  ;(getGlobal() as any)[BIND_FLAG] = flag
}

export function dispatchStorageEvent({
  key,
  newValue,
  oldValue,
  type,
}: Pick<StorageEvent, "key" | "newValue" | "oldValue" | "type">) {
  const naturalStorageEvent = new StorageEvent(type, {
    key,
    newValue,
    oldValue,
    url: getGlobal().location.href,
    storageArea: localStorage,
  })
  getGlobal()?.dispatchEvent(naturalStorageEvent)
}

export function jsonParse(data: string | null) {
  const dest = data === "undefined" || data === undefined ? null : data
  return JSON.parse(dest as string)
}

export function each(funcs: StoreListener[], ev: StorageEvent, defaultKey: string | null) {
  let newValue: StoretifyEventValue = null
  let oldValue: StoretifyEventValue = null
  try {
    newValue = jsonParse(ev.newValue)?.value ?? newValue
    oldValue = jsonParse(ev.oldValue)?.value ?? oldValue
  } catch (error) {
    console.warn(`has an exception in your json parse, from ${ev.url}, .eg ${error}`)
  }
  const mutationalStorageEvent = {
    type: ev.type,
    key: ev.key === null ? defaultKey : ev.key,
    newValue,
    oldValue,
    url: ev.url,
    isTrusted: ev.isTrusted,
    native: ev,
  } as StoretifyEvent

  funcs.forEach((func: StoreListener) => {
    if (typeof func === "function") {
      try {
        func(mutationalStorageEvent)
      } catch (error) {
        console.warn(`has an exception in your ${func.name || "anonymous function"}( ev ){
          ${error}
        }`)
      }
    }
  })
}

export function isValidKey(key: string) {
  if (typeof key !== "string") {
    console.warn("store failed, entry a valid string key.")
  }
}

export default {
  dispatchStorageEvent,
  jsonParse,
  each,
  getGlobal,
}
