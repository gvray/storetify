import store from "../src"
import type { Storetify, StoretifyValue, StoretifySafeValue, StoretifyEvent, StoreListener } from "../src/type"

describe("type", () => {
  test("just test type", () => {
    // ✅ Test storing primitive types
    store("string", "hello")
    store("number", 123)
    store("boolean", true)
    store("null", null)

    // ✅ Test storing objects and arrays
    store("object", { name: "test", nested: { age: 1 } })
    store("array", [1, 2, { a: "b" }])

    // ✅ Test lazy value setting via functions
    store("lazy", () => "computed")
    store("lazyObj", () => ({ computed: true }))

    // ✅ Test retrieving values
    const stringValue: StoretifySafeValue<string> = store("string")
    const objectValue: StoretifySafeValue = store("object")
    const arrayValue: StoretifySafeValue = store("array")

    // ✅ Test deleting a key
    store("string", undefined)

    // ✅ Test `set`, `get`, `remove`
    store.set("foo", "bar")
    const val = store.get<string>("foo")
    store.remove("foo")

    // ✅ Test `has`
    const exists: boolean = store.has("object")

    // ✅ Test `clear`
    store.clear()

    // ✅ Test `subscribe` and `unsubscribe`
    const listener = (e: StoretifyEvent<{ a: number }>) => {
      e.oldValue.a = 1
      console.log(e.key, e.oldValue, e.newValue, e.type)
    }
    store.subscribe("object", listener)
    store.unsubscribe("object", listener)
    store.unsubscribe(["object", "array"])

    // ✅ Test `getObserver` and `getUsed`
    const observers = store.getObserver("object")
    const used = store.getUsed()

    // ✅ Test calling with multiple arguments
    store("multiArg", () => "multi", 3600)
    store("multiArg", "direct", 3600)

    // ✅ Type inference test
    function typedSet<T extends StoretifyValue>(key: string, value: T) {
      store(key, value)
      const result: StoretifySafeValue<T> = store(key)
      return result
    }
    const result = typedSet("typed", { x: 1, y: "z" })

    console.log("All storetify type tests passed.")
  })

  test("test edge cases and error conditions", () => {
    // 测试 getItem 方法的过期逻辑
    store.set("expire-test", "value", 1)

    // 立即获取应该有值
    expect(store.get("expire-test")).toBe("value")

    // 测试 has 方法
    expect(store.has("expire-test")).toBe(true)
    expect(store.has("non-existent")).toBe(false)

    // 测试 unsubscribe 的不同参数组合
    const listener1 = jest.fn()
    const listener2 = jest.fn()

    store.subscribe("unsubscribe-test", listener1)
    store.subscribe("unsubscribe-test", listener2)

    // 测试按监听器名称取消订阅
    Object.defineProperty(listener1, "name", { value: "listener1" })
    store.unsubscribe("unsubscribe-test", listener1)

    store.set("unsubscribe-test", "trigger")
    expect(listener1).not.toHaveBeenCalled()
    expect(listener2).toHaveBeenCalled()

    // 测试取消所有订阅
    store.unsubscribe()

    // 测试 getObserver 方法
    const observers = store.getObserver("non-existent")
    expect(observers).toEqual([])
  })

  test("test namespace functionality", () => {
    // 测试命名空间功能
    const originalNamespace = (store as any).storage.getNamespace()

    ;(store as any).storage.setNamespace("test-namespace")
    expect((store as any).storage.getNamespace()).toBe("test-namespace")

    // 恢复原始命名空间
    ;(store as any).storage.setNamespace(originalNamespace)
  })

  test("test setStore functionality", () => {
    // 测试 setStore 方法
    const mockStore = {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 0,
      key: jest.fn(() => null),
    } as any

    const originalStore = (store as any).storage.getStore()
    ;(store as any).storage.setStore(mockStore)

    // 验证新的存储被设置
    store.set("test-custom-store", "value")
    expect(mockStore.setItem).toHaveBeenCalled()

    // 恢复原始存储
    ;(store as any).storage.setStore(originalStore)
  })

  test("test remove without soft parameter", () => {
    // 测试 NextStorage.ts 第160行 - soft !== true 分支
    store.set("remove-hard-test", "value")
    store.subscribe("remove-hard-test", () => {})

    // 验证订阅者存在
    expect(store.getObserver("remove-hard-test").length).toBeGreaterThan(0)

    // 执行普通 remove（不是 soft remove）
    store.remove("remove-hard-test")

    // 验证数据被删除
    expect(store.get("remove-hard-test")).toBe(null)

    // 验证订阅者也被删除
    expect(store.getObserver("remove-hard-test").length).toBe(0)
  })

  test("test window object availability", () => {
    // 测试 utils.ts 中 window 对象的可用性
    expect(window).toBeDefined()
    expect(window.dispatchEvent).toBeDefined()
    expect(window.location).toBeDefined()
    expect(window.localStorage).toBeDefined()
  })
})
