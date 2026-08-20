/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------- JSON Safe Value ----------
type JSONPrimitive = string | number | boolean | null;
type JSONArray = Array<StoretifyValue>;

export type StoretifyValue = JSONPrimitive | JSONObject | JSONArray;
export interface JSONObject {
  [key: string]: StoretifyValue;
}

// ---------- Core Value Types ----------
export type StoretifyValueOrNull<T = StoretifyValue> = T | null;

export type StoretifySetter<T = StoretifyValue> = (...args: any[]) => StoretifyValueOrNull<T>;

export type StoretifyArgs = [string, (StoretifyValue | StoretifySetter)?, number?];

// ---------- Event Types ----------
export interface StoretifyEvent<T = StoretifyValue> extends Omit<
  StorageEvent,
  'newValue' | 'oldValue'
> {
  newValue: StoretifyValueOrNull<T>;
  oldValue: StoretifyValueOrNull<T>;
  native: StorageEvent;
}

export type StoretifyListener<T = StoretifyValue> = (e: StoretifyEvent<T>) => void;

// ---------- Storage Engine ----------
export interface StorageEngine {
  set<T = StoretifyValue>(key: string, value: T, expires?: number): StorageEngine;
  get<T = StoretifyValue>(key: string): T | null;
  remove(key: string, soft?: boolean): StorageEngine;
  has(key: string): boolean;
  clear(): void;
  subscribe(key: string, listener: StoretifyListener): StorageEngine;
  unsubscribe(keys?: string | string[], listener?: StoretifyListener): void;
  getObserver(key: string): StoretifyListener[];
  getUsed(): string;
}

// ---------- API Types ----------
export interface StoretifyApi extends StorageEngine {
  storage: StorageEngine;
  set<T = StoretifyValue>(
    key: string,
    value: StoretifyValueOrNull<T> | StoretifySetter<T>,
    expires?: number
  ): StoretifyApi;
  remove(key: string, soft?: boolean): StoretifyApi;
  subscribe(key: string, listener: StoretifyListener): StoretifyApi;
}

export interface Storetify extends StoretifyApi {
  <T extends StoretifyValue | StoretifySetter<T>>(
    key: string,
    value: T,
    expires?: number
  ): StoretifyApi;
  <T = StoretifyValue>(key: string): StoretifyValueOrNull<T>;
  <T = StoretifyValue>(...rest: StoretifyArgs): StoretifyValueOrNull<T> | StoretifyApi;
}
