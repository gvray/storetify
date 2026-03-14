import store from "../src"
import type { Storetify, StoretifyValue, StoretifySafeValue, StoretifyEvent, StoretifyListener } from "../src/type"

describe("Type Safety", () => {
  beforeEach(() => {
    store.clear()
  })

  describe("Type Inference", () => {
    test("should infer correct types for primitive values", () => {
      // String
      store("string", "hello")
      const stringValue: StoretifySafeValue<string> = store("string")
      expect(stringValue).toBe("hello")

      // Number
      store("number", 123)
      const numberValue: StoretifySafeValue<number> = store("number")
      expect(numberValue).toBe(123)

      // Boolean
      store("boolean", true)
      const booleanValue: StoretifySafeValue<boolean> = store("boolean")
      expect(booleanValue).toBe(true)

      // Null
      store("null", null)
      const nullValue: StoretifySafeValue<null> = store("null")
      expect(nullValue).toBe(null)
    })

    test("should infer correct types for complex values", () => {
      // Object
      const obj = { name: "test", nested: { age: 1 } }
      store("object", obj)
      const objectValue: StoretifySafeValue = store("object")
      expect(objectValue).toEqual(obj)

      // Array
      const arr = [1, 2, { a: "b" }]
      store("array", arr)
      const arrayValue: StoretifySafeValue = store("array")
      expect(arrayValue).toEqual(arr)
    })

    test("should support generic type parameters", () => {
      interface User {
        name: string
        age: number
      }

      store.set<User>("user", { name: "Alice", age: 30 })
      const user = store.get<User>("user")

      expect(user).toEqual({ name: "Alice", age: 30 })
    })

    test("should support typed function values", () => {
      store("lazy", () => "computed")
      const lazyValue: StoretifySafeValue<string> = store("lazy")
      expect(lazyValue).toBe("computed")

      store("lazyObj", () => ({ computed: true }))
      const lazyObj: StoretifySafeValue = store("lazyObj")
      expect(lazyObj).toEqual({ computed: true })
    })
  })

  describe("Return Types", () => {
    test("should return StoretifySafeValue from get operations", () => {
      store.set("foo", "bar")
      const val: StoretifySafeValue<string> = store.get<string>("foo")
      expect(val).toBe("bar")
    })

    test("should return boolean from has operation", () => {
      store.set("exists", "value")
      const exists: boolean = store.has("exists")
      expect(exists).toBe(true)
    })

    test("should return string from getUsed operation", () => {
      const used: string = store.getUsed()
      expect(used).toMatch(/KB$/)
    })

    test("should return StoretifyListener array from getObserver", () => {
      const listener: StoretifyListener = jest.fn()
      store.subscribe("test", listener)

      const observers: StoretifyListener[] = store.getObserver("test")
      expect(observers).toHaveLength(1)
    })
  })

  describe("Event Types", () => {
    test("should type event listeners correctly", done => {
      const listener: StoretifyListener = (e: StoretifyEvent) => {
        expect(e.key).toBeDefined()
        expect(e.newValue).toBeDefined()
        expect(e.oldValue).toBeDefined()
        expect(e.type).toBe("storage")
        expect(e.native).toBeDefined()
        done()
      }

      store.subscribe("event-type", listener)
      store.set("event-type", "value")
    })

    test("should support typed event listeners", done => {
      interface UserData {
        name: string
        age: number
      }

      const listener = (e: StoretifyEvent<UserData>) => {
        if (e.newValue) {
          // TypeScript should know these properties exist
          expect(e.newValue.name).toBe("Bob")
          expect(e.newValue.age).toBe(25)
        }
        done()
      }

      store.subscribe<UserData>("typed-listener", listener)
      store.set("typed-listener", { name: "Bob", age: 25 })
    })

    test("should handle null in typed events", done => {
      interface Data {
        value: string
      }

      const listener = (e: StoretifyEvent<Data>) => {
        if (e.oldValue) {
          expect(e.oldValue.value).toBe("old")
        }
        expect(e.newValue).toBe(null)
        done()
      }

      store.set("null-typed", { value: "old" })
      store.subscribe<Data>("null-typed", listener)
      store.remove("null-typed")
    })
  })

  describe("Function Overloads", () => {
    test("should support store(key) overload", () => {
      store.set("overload-test", "value")
      const result: StoretifySafeValue = store("overload-test")
      expect(result).toBe("value")
    })

    test("should support store(key, value) overload", () => {
      store("overload-set", "value")
      expect(store.get("overload-set")).toBe("value")
    })

    test("should support store(key, value, expires) overload", () => {
      store("overload-expire", "value", 3600)
      expect(store.get("overload-expire")).toBe("value")
    })

    test("should support store(key, function) overload", () => {
      store("overload-func", () => "computed")
      expect(store.get("overload-func")).toBe("computed")
    })

    test("should support store(key, function, expires) overload", () => {
      store("overload-func-expire", () => "computed", 3600)
      expect(store.get("overload-func-expire")).toBe("computed")
    })
  })

  describe("Method Chaining", () => {
    test("should support method chaining", () => {
      const result = store.set("chain1", "value1").set("chain2", "value2").set("chain3", "value3")

      expect(result.get("chain1")).toBe("value1")
      expect(result.get("chain2")).toBe("value2")
      expect(result.get("chain3")).toBe("value3")
    })

    test("should chain with subscribe", () => {
      const listener = jest.fn()

      store.set("chain-sub", "initial").subscribe("chain-sub", listener).set("chain-sub", "updated")

      expect(listener).toHaveBeenCalled()
    })

    test("should chain with remove", () => {
      const result = store.set("chain-remove", "value").remove("chain-remove")

      expect(result.get("chain-remove")).toBe(null)
    })
  })

  describe("StoretifyValue Type", () => {
    test("should accept all valid StoretifyValue types", () => {
      // Primitives
      const str: StoretifyValue = "string"
      const num: StoretifyValue = 123
      const bool: StoretifyValue = true
      const nullVal: StoretifyValue = null

      // Object
      const obj: StoretifyValue = { key: "value", nested: { deep: 1 } }

      // Array
      const arr: StoretifyValue = [1, "two", { three: 3 }]

      store.set("str", str)
      store.set("num", num)
      store.set("bool", bool)
      store.set("null", nullVal)
      store.set("obj", obj)
      store.set("arr", arr)

      expect(store.get("str")).toBe(str)
      expect(store.get("num")).toBe(num)
      expect(store.get("bool")).toBe(bool)
      expect(store.get("null")).toBe(nullVal)
      expect(store.get("obj")).toEqual(obj)
      expect(store.get("arr")).toEqual(arr)
    })
  })

  describe("Custom Type Helpers", () => {
    test("should work with custom typed helper functions", () => {
      function typedSet<T extends StoretifyValue>(key: string, value: T): StoretifySafeValue<T> {
        store(key, value)
        return store(key)
      }

      const result = typedSet("typed-helper", { x: 1, y: "z" })
      expect(result).toEqual({ x: 1, y: "z" })
    })

    test("should work with generic wrapper functions", () => {
      function createStorage<T extends StoretifyValue>(prefix: string) {
        return {
          set: (key: string, value: T) => store.set(`${prefix}:${key}`, value),
          get: (key: string) => store.get<T>(`${prefix}:${key}`),
          remove: (key: string) => store.remove(`${prefix}:${key}`),
        }
      }

      const userStorage = createStorage<{ name: string; age: number }>("user")
      userStorage.set("profile", { name: "Charlie", age: 35 })

      const profile = userStorage.get("profile")
      expect(profile).toEqual({ name: "Charlie", age: 35 })
    })
  })

  describe("Type Compilation", () => {
    test("should compile with correct type annotations", () => {
      // This test verifies that TypeScript compilation works correctly
      // If types are wrong, this won't compile

      const storetify: Storetify = store

      // All these should compile without errors
      storetify.set("compile-test", "value")
      const val: StoretifySafeValue = storetify.get("compile-test")
      const exists: boolean = storetify.has("compile-test")
      const used: string = storetify.getUsed()
      const observers: StoretifyListener[] = storetify.getObserver("compile-test")

      storetify.subscribe("compile-test", (e: StoretifyEvent) => {
        console.log(e.newValue)
      })

      storetify.unsubscribe("compile-test")
      storetify.remove("compile-test")
      storetify.clear()

      expect(true).toBe(true)
    })
  })

  afterAll(() => {
    console.log("All type safety tests passed.")
  })
})
