import { TextEncoder } from 'util';
import store from '../src/index';
import NextStorage from '../src/NextStorage';

describe('Core API', () => {
  beforeEach(() => {
    store.clear();
  });

  describe('Basic Operations', () => {
    test('should set and get values', () => {
      store.set('token', 'abc123');
      expect(store.get('token')).toBe('abc123');
    });

    test('should handle different data types', () => {
      store.set('string', 'hello');
      store.set('number', 123);
      store.set('boolean', true);
      store.set('null', null);
      store.set('object', { name: 'test', nested: { age: 1 } });
      store.set('array', [1, 2, { a: 'b' }]);

      expect(store.get('string')).toBe('hello');
      expect(store.get('number')).toBe(123);
      expect(store.get('boolean')).toBe(true);
      expect(store.get('null')).toBe(null);
      expect(store.get('object')).toEqual({ name: 'test', nested: { age: 1 } });
      expect(store.get('array')).toEqual([1, 2, { a: 'b' }]);
    });

    test('should remove values', () => {
      store.set('token', 'value');
      expect(store.get('token')).toBe('value');

      store.remove('token');
      expect(store.get('token')).toBe(null);
    });

    test('should clear all values', () => {
      store.set('key1', 'value1');
      store.set('key2', 'value2');

      store.clear();

      expect(store.get('key1')).toBe(null);
      expect(store.get('key2')).toBe(null);
    });

    test('should check if key exists', () => {
      store.set('exists', 'value');

      expect(store.has('exists')).toBe(true);
      expect(store.has('non-existent')).toBe(false);
    });
  });

  describe('Shorthand store() Syntax', () => {
    test('should return null for invalid arguments', () => {
      // Call store with no arguments should return null
      const result = (store as unknown as () => null)();
      expect(result).toBe(null);
    });

    test('should support store(key, value) syntax', () => {
      store('shorthand', 'value');
      expect(store('shorthand')).toBe('value');
    });

    test('should support store(key) for reading', () => {
      store.set('read-test', 'data');
      expect(store('read-test')).toBe('data');
    });

    test('should support store(key, undefined) for deletion', () => {
      store('delete-test', 'value');
      expect(store('delete-test')).toBe('value');

      store('delete-test', undefined);
      expect(store('delete-test')).toBe(null);
    });

    test('should support function values for lazy evaluation', () => {
      store('lazy', () => 'computed');
      expect(store('lazy')).toBe('computed');

      store('lazy-obj', () => ({ computed: true }));
      expect(store('lazy-obj')).toEqual({ computed: true });
    });

    test('should support function values via store.set()', () => {
      store.set('lazy-set', () => 'computed');
      expect(store.get('lazy-set')).toBe('computed');

      store.set('lazy-set-obj', () => ({ computed: true }));
      expect(store.get('lazy-set-obj')).toEqual({ computed: true });
    });

    test('should support function values with expiration via store.set()', () => {
      store.set('lazy-set-expire', () => 'computed', 1);
      expect(store.get('lazy-set-expire')).toBe('computed');
    });
  });

  describe('Namespace Management', () => {
    test('should set and get namespace', () => {
      const namespace = 'my-app';
      const storage = store.storage as NextStorage;
      storage.setNamespace(namespace);
      expect(storage.getNamespace()).toBe(namespace);
    });
  });

  describe('Storage Information', () => {
    test('should get storage usage', () => {
      store.set('usage-test', 'some data');
      const used = store.getUsed();

      expect(used).toMatch(/KB$/);
      expect(parseFloat(used)).toBeGreaterThan(0);
    });

    test('should calculate byte size for non-ASCII characters', () => {
      const globalAny = globalThis as typeof globalThis & { TextEncoder?: typeof TextEncoder };
      const originalTextEncoder = globalAny.TextEncoder;
      globalAny.TextEncoder = TextEncoder;

      try {
        store.set('usage-test-ascii', 'aaaa');
        const asciiUsed = parseFloat(store.getUsed());

        store.clear();
        store.set('usage-test-unicode', '中文字符');
        const unicodeUsed = parseFloat(store.getUsed());

        // 中文 UTF-8 每个字符占 3 字节，所以 unicodeUsed 应该明显大于 asciiUsed
        expect(unicodeUsed).toBeGreaterThan(asciiUsed);
      } finally {
        globalAny.TextEncoder = originalTextEncoder;
      }
    });

    test('should get observers for a key', () => {
      const listener = jest.fn();
      store.subscribe('observer-test', listener);

      const observers = store.getObserver('observer-test');
      expect(observers).toHaveLength(1);
      expect(observers[0]).toBe(listener);
    });

    test('should return empty array for non-existent key observers', () => {
      const observers = store.getObserver('non-existent');
      expect(observers).toEqual([]);
    });
  });

  describe('Custom Storage Backend', () => {
    test('should allow setting custom storage', () => {
      const mockStore = {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        length: 0,
        key: jest.fn(() => null),
      } as unknown as Storage;

      const storage = store.storage as NextStorage;
      const originalStore = storage.getStore();
      storage.setStore(mockStore);

      store.set('custom-store-test', 'value');
      expect(mockStore.setItem).toHaveBeenCalled();

      // Restore original storage
      storage.setStore(originalStore);
    });
  });
});
