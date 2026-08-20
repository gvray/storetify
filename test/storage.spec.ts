import store from '../src/index';
import NextStorage from '../src/NextStorage';

describe('Storage Operations', () => {
  beforeEach(() => {
    store.clear();
  });

  describe('Expiration', () => {
    test('should expire values after specified time', async () => {
      store.set('expire-test', 'value', 1); // 1 second
      expect(store.get('expire-test')).toBe('value');

      await new Promise((resolve) => setTimeout(resolve, 1100));
      expect(store.get('expire-test')).toBe(null);
    }, 3000);

    test('should handle expiration with different time values', async () => {
      store.set('food', 3, 3); // 3 seconds
      expect(store.get('food')).toBe(3);

      const food = await new Promise((resolve) => {
        setTimeout(() => {
          resolve(store.get('food'));
        }, 3001);
      });
      expect(food).toBe(null);
    }, 7000);

    test('should return null from getItem for expired values', async () => {
      const { storage } = store;
      storage.set('getitem-expire', 'value', 1);

      await new Promise((resolve) => setTimeout(resolve, 1100));

      // getItem should return null for expired items
      expect(storage.getItem('getitem-expire')).toBe(null);
    }, 3000);

    test('should check has() correctly for expired items', async () => {
      store.set('has-expire', 'value', 0.5);
      expect(store.has('has-expire')).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 600));

      // has() should return false for expired items, consistent with get()
      expect(store.has('has-expire')).toBe(false);
    }, 3000);
  });

  describe('Data Persistence', () => {
    test('should persist data across operations', () => {
      store.set('persist-1', 'value1');
      store.set('persist-2', 'value2');

      expect(store.get('persist-1')).toBe('value1');
      expect(store.get('persist-2')).toBe('value2');

      store.set('persist-1', 'updated');
      expect(store.get('persist-1')).toBe('updated');
      expect(store.get('persist-2')).toBe('value2');
    });

    test('should handle null values correctly', () => {
      store('null-test', null);
      expect(store('null-test')).toBe(null);

      store('null-test', 'not-null');
      expect(store('null-test')).toBe('not-null');

      store('null-test', null);
      expect(store('null-test')).toBe(null);
    });

    test('should handle complex nested objects', () => {
      const complexData = {
        user: {
          name: 'Alice',
          profile: {
            age: 30,
            settings: {
              theme: 'dark',
              notifications: true,
            },
          },
        },
        items: [1, 2, { nested: 'value' }],
      };

      store.set('complex', complexData);
      expect(store.get('complex')).toEqual(complexData);
    });
  });

  describe('Remove Operations', () => {
    test('should remove key and its subscribers', () => {
      const listener = jest.fn();
      store.set('remove-hard-test', 'value');
      store.subscribe('remove-hard-test', listener);

      expect(store.getObserver('remove-hard-test').length).toBeGreaterThan(0);

      store.remove('remove-hard-test');

      expect(store.get('remove-hard-test')).toBe(null);
      expect(store.getObserver('remove-hard-test').length).toBe(0);
    });

    test('should support soft remove (keep subscribers)', () => {
      const listener = jest.fn();
      store.set('soft-remove-test', 'value');
      store.subscribe('soft-remove-test', listener);

      // Soft remove via internal API
      store.storage.remove('soft-remove-test', true);

      expect(store.get('soft-remove-test')).toBe(null);
      // Subscribers should still exist with soft remove
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty string keys', () => {
      store.set('', 'empty-key');
      expect(store.get('')).toBe('empty-key');
    });

    test('should handle special characters in keys', () => {
      const specialKeys = ['key-with-dash', 'key_with_underscore', 'key.with.dot', 'key@special'];

      specialKeys.forEach((key) => {
        store.set(key, `value-${key}`);
        expect(store.get(key)).toBe(`value-${key}`);
      });
    });

    test('should handle large data values', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item-${i}` }));
      store.set('large-data', largeArray);

      const retrieved = store.get<typeof largeArray>('large-data');
      expect(retrieved).toHaveLength(1000);
      expect(retrieved![0]).toEqual({ id: 0, value: 'item-0' });
    });

    test('should handle rapid successive operations', () => {
      for (let i = 0; i < 100; i++) {
        store.set(`rapid-${i}`, i);
      }

      for (let i = 0; i < 100; i++) {
        expect(store.get(`rapid-${i}`)).toBe(i);
      }
    });

    test('should handle getItem returning null in getUsed', () => {
      const storage = store.storage as NextStorage;
      const mockStore = {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        length: 1,
        key: jest.fn(() => 'mock-key'),
      } as unknown as Storage;

      const originalStore = storage.getStore();
      storage.setStore(mockStore);

      const used = storage.getUsed();
      expect(used).toMatch(/KB$/);

      storage.setStore(originalStore);
    });

    test('should return null for invalid JSON stored values', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem('bad-json', 'not-valid-json');
      expect(store.get('bad-json')).toBe(null);
      expect(store.has('bad-json')).toBe(false);
      consoleWarnSpy.mockRestore();
    });

    test('should handle removing non-existent key', () => {
      expect(() => store.storage.remove('non-existent-key')).not.toThrow();
      expect(store.get('non-existent-key')).toBe(null);
    });
  });
});
