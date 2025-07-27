import NextStorage from "../NextStorage"

// JSON SAFE
export type JSONPrimitive = string | number | boolean | null
// eslint-disable-next-line no-use-before-define
export type StoretifyValue = JSONPrimitive | JSONObject | JSONArray
export interface JSONObject {
  [key: string]: StoretifyValue
}

// eslint-disable-next-line no-use-before-define
export type JSONArray = Array<StoretifyValue>

export type StoretifySafeValue<T = StoretifyValue> = T | null
export type StoreArgument<T extends StoretifyValue | ((...rest: any) => StoretifyValue)> = [string, T?, number?]

export type StoretifyEventValue = StoretifyValue
export interface StoretifyEvent<T = StoretifyEventValue> extends Omit<StorageEvent, "newValue" | "oldValue"> {
  newValue: T
  oldValue: T
  native: StorageEvent
}
export type StoreListener = (e: any) => void

export interface StoreStage {
  storage: NextStorage
  set: <T = StoretifyValue>(
    key: string,
    value: StoretifySafeValue<T> | ((...rest: any) => StoretifySafeValue<T>),
    expires?: number,
  ) => StoreStage
  get: <T = StoretifyValue>(key: string) => StoretifySafeValue<T>
  remove: (key: string, soft?: boolean) => StoreStage
  has: (key: string) => boolean
  clear: () => void
  subscribe: <T>(key: string, listener: (e: StoretifyEvent<T>) => void) => StoreStage
  unsubscribe: <T>(keys?: string | string[], listener?: (e: StoretifyEvent<T>) => void) => void
  getObserver(key: string): StoreListener[]
  getUsed: () => string
}

// StoreStage Partial
export interface StoretifyStage extends Partial<StoreStage> {
  <T extends StoretifyValue | ((...args: any) => StoretifySafeValue<T>)>(
    key: string,
    value: T,
    expires?: number,
  ): StoreStage
  <T = StoretifyValue>(key: string): StoretifySafeValue<T>
  <T>(...rest: StoreArgument<StoretifyValue | ((...args: any) => StoretifyValue)>): StoretifySafeValue<T> | StoreStage
}

export interface Storetify extends StoreStage {
  <T extends StoretifyValue | ((...args: any) => StoretifySafeValue<T>)>(
    key: string,
    value: T,
    expires?: number,
  ): StoreStage
  <T = StoretifyValue>(key: string): StoretifySafeValue<T>
  <T>(...rest: StoreArgument<StoretifyValue | ((...args: any) => StoretifyValue)>): StoretifySafeValue<T> | StoreStage
}
