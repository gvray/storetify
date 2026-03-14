/* eslint-disable @typescript-eslint/no-explicit-any */
import NextStorage from '../NextStorage';

// JSON SAFE
export type JSONPrimitive = string | number | boolean | null;

export type StoretifyValue = JSONPrimitive | JSONObject | JSONArray;
export interface JSONObject {
  [key: string]: StoretifyValue;
}

export type JSONArray = Array<StoretifyValue>;

export type StoretifySafeValue<T = StoretifyValue> = T | null;
export type StoretifySetterFunction<T = StoretifyValue> = (...args: any[]) => StoretifySafeValue<T>;
export type StoretifyArgument<T extends StoretifyValue | StoretifySetterFunction> = [
  string,
  T?,
  number?,
];

export interface StoretifyEvent<T = StoretifyValue> extends Omit<
  StorageEvent,
  'newValue' | 'oldValue'
> {
  newValue: StoretifySafeValue<T>;
  oldValue: StoretifySafeValue<T>;
  native: StorageEvent;
}
export type StoretifyListener<T = StoretifyValue> = (e: StoretifyEvent<T>) => void;

export interface StoretifyStoreStage {
  storage: NextStorage;
  set: <T = StoretifyValue>(
    key: string,
    value: StoretifySafeValue<T> | StoretifySetterFunction<T>,
    expires?: number
  ) => StoretifyStoreStage;
  get: <T = StoretifyValue>(key: string) => StoretifySafeValue<T>;
  remove: (key: string, soft?: boolean) => StoretifyStoreStage;
  has: (key: string) => boolean;
  clear: () => void;
  subscribe: <T = StoretifyValue>(
    key: string,
    listener: StoretifyListener<T>
  ) => StoretifyStoreStage;
  unsubscribe: <T = StoretifyValue>(
    keys?: string | string[],
    listener?: StoretifyListener<T>
  ) => void;
  getObserver<T = StoretifyValue>(key: string): StoretifyListener<T>[];
  getUsed: () => string;
}

export interface StoretifyStage extends Partial<StoretifyStoreStage> {
  <T extends StoretifyValue | StoretifySetterFunction<T>>(
    key: string,
    value: T,
    expires?: number
  ): StoretifyStoreStage;
  <T = StoretifyValue>(key: string): StoretifySafeValue<T>;
  <T = StoretifyValue>(
    ...rest: StoretifyArgument<StoretifyValue | StoretifySetterFunction>
  ): StoretifySafeValue<T> | StoretifyStoreStage;
}

export interface Storetify extends StoretifyStoreStage {
  <T extends StoretifyValue | StoretifySetterFunction<T>>(
    key: string,
    value: T,
    expires?: number
  ): StoretifyStoreStage;
  <T = StoretifyValue>(key: string): StoretifySafeValue<T>;
  <T = StoretifyValue>(
    ...rest: StoretifyArgument<StoretifyValue | StoretifySetterFunction>
  ): StoretifySafeValue<T> | StoretifyStoreStage;
}
