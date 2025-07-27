import store, { StoretifyEvent } from "../src/index"
import { jsonParse, dispatchStorageEvent } from "../src/utils"

describe("storetify api test", () => {
  test("test setNamespace getNamespace", () => {
    const namespace = "my-store"
    ;(store as any).setNamespace(namespace)
    expect((store as any).getNamespace()).toBe(namespace)
  })
  test("test setStore getStore", () => {
    ;(store as any).setStore(localStorage)
    expect((store as any).getStore).toBeUndefined()
  })
  test("test set get remove", () => {
    const key = "token"
    const key2 = "token2"
    store.set(key, 1)
    expect(store.get(key)).toBe(1)
    store.set(key2, 2)
    expect(store.get(key2)).toBe(2)
    store.set(key, "1")
    expect(store.get(key)).toBe("1")
    store.remove(key2)
    expect(store.get(key2)).toBe(null)
  })
  test("test set null undefined", () => {
    store("theme", null)
    expect(store("theme")).toBe(null)
    store("theme", "dark")
    expect(store("theme")).toBe("dark")
    store("theme", undefined) // remove theme
    expect(store("theme")).toBe(null)
  })
  test("test set get from expires", async () => {
    store.set("food", 3, 3)
    expect(store.get("food")).toBe(3)
    const food = await new Promise(resolve => {
      setTimeout(() => {
        resolve(store.get("food"))
      }, 3001)
    })
    expect(food).toBe(null)
  }, 7000)
  test("test set subscribe", done => {
    store.set("token", 3, 3)
    store.subscribe("token", ev => {
      expect(ev.newValue).toBe(5)
      expect(ev.oldValue).toBe(null)
      done()
    })
    setTimeout(() => {
      store.set("token", 5, 3)
    }, 3001)
  }, 7000)
  test("test has", () => {
    store("color", "#fff")
    expect(store.has("color")).toBeTruthy()
    expect(store.has("color2")).toBeFalsy()
  })
  test("test subscribe unsubscribe", () => {
    store.subscribe("key1", () => {
      // 空函数用作占位符
    })
    store.subscribe("key2", () => {
      // 空函数用作占位符
    })
    store.subscribe("key3", () => {
      // 空函数用作占位符
    })
    store.unsubscribe(["key1", "key2"])
  })
  test("test Exception", () => {
    // not input message to terminal
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {
      // 空函数用作占位符
    })
    store.set(1 as any, 1)
    expect(store(1 as any)).toBe(null)
    expect(consoleWarnSpy).toHaveBeenCalledWith("store failed, entry a valid string key.")
  })
  test("test subscribe and expires", done => {
    store("token-6823", "xxxx", 5)
    const callFun = (ev: StoretifyEvent) => {
      if (ev.newValue) {
        done()
      }
    }
    store.subscribe("token-6823", callFun)
    setTimeout(() => {
      const token = store("token-6823")
      expect(token).toBeNull()
      store.set("token-6823", "xxxx", 10)
    }, 5500)
  }, 7000)

  test("test NextStorage getInstance with custom store", () => {
    // 测试 NextStorage.getInstance 的分支覆盖
    const customStore = {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 0,
      key: jest.fn(() => null),
    } as any

    // 重置单例以测试新实例创建
    ;(store as any).storage.constructor.storage = null
    const newInstance = (store as any).storage.constructor.getInstance(customStore)
    expect(newInstance).toBeDefined()
  })

  test("test publish with array observers", () => {
    const mockListener1 = jest.fn()
    const mockListener2 = jest.fn()
    const listeners = [mockListener1, mockListener2]

    // 直接调用 publish 方法测试数组分支
    const mockEvent = {
      key: "test-key",
      newValue: JSON.stringify({ value: "new", expires: null }),
      oldValue: JSON.stringify({ value: "old", expires: null }),
      type: "storage",
      url: window.location.href,
      isTrusted: true,
    } as StorageEvent

    ;(store as any).storage.publish(listeners, mockEvent, true, "test-key")
    expect(mockListener1).toHaveBeenCalled()
    expect(mockListener2).toHaveBeenCalled()
  })

  test("test remove with soft parameter", () => {
    store.set("soft-test", "value")
    store.subscribe("soft-test", () => {
      // 空函数用作测试订阅者
    })

    // 测试 soft remove (不删除订阅者)
    ;(store as any).storage.remove("soft-test", true)
    expect(store.get("soft-test")).toBe(null)

    // 验证订阅者仍然存在
    const observers = store.getObserver("soft-test")
    expect(observers.length).toBeGreaterThan(0)
  })

  test("test error handling in jsonParse", () => {
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})

    // 创建一个会导致 JSON 解析错误的场景
    const mockEvent = {
      key: "error-test",
      newValue: "invalid-json",
      oldValue: "also-invalid",
      type: "storage",
      url: window.location.href,
      isTrusted: true,
    } as StorageEvent

    const mockListener = jest.fn()
    ;(store as any).storage.publish([mockListener], mockEvent, true, "error-test")

    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("has an exception in your json parse"))

    consoleWarnSpy.mockRestore()
  })

  test("test error handling in listener execution", () => {
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})

    // 创建一个会抛出错误的监听器
    const errorListener = () => {
      throw new Error("Test error")
    }

    store.subscribe("error-listener-test", errorListener)
    store.set("error-listener-test", "trigger-error")

    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("has an exception in your"))

    consoleWarnSpy.mockRestore()
  })

  test("test publish force parameter", () => {
    const mockListener = jest.fn()
    const mockEvent = {
      key: "force-test",
      newValue: JSON.stringify({ value: "new", expires: null }),
      oldValue: JSON.stringify({ value: "old", expires: null }),
      type: "storage",
      url: window.location.href,
      isTrusted: true,
    } as StorageEvent

    // 测试没有 force 且没有观察者的情况
    ;(store as any).storage.publish("non-existent-key", mockEvent, false)
    expect(mockListener).not.toHaveBeenCalled()

    // 测试有 force 的情况
    ;(store as any).storage.publish([mockListener], mockEvent, true)
    expect(mockListener).toHaveBeenCalled()
  })

  test("test jsonParse with undefined", () => {
    // 测试 utils.ts jsonParse 函数的 undefined 分支
    // 测试 undefined 输入
    const result1 = jsonParse("undefined")
    expect(result1).toBe(null)

    const result2 = jsonParse(undefined as any)
    expect(result2).toBe(null)
  })

  test("test publish with string observers and has check", () => {
    // 测试 NextStorage.ts 第109行 - has 检查的具体分支
    const mockEvent = {
      key: "has-string-test",
      newValue: JSON.stringify({ value: "new", expires: null }),
      oldValue: JSON.stringify({ value: "old", expires: null }),
      type: "storage",
      url: window.location.href,
      isTrusted: true,
    } as StorageEvent

    // 测试当 observers 是字符串且 has 方法被调用时的情况
    const { storage } = store as any
    const originalHas = storage.has
    const originalGetObserver = storage.getObserver

    // Mock has 方法返回 false
    storage.has = jest.fn(() => false)
    storage.getObserver = jest.fn(() => [])

    // 调用 publish，这应该触发第109行的 has 检查
    storage.publish("non-existent-key", mockEvent, false)

    expect(storage.getObserver).toHaveBeenCalledWith("non-existent-key")

    // 恢复原始方法
    storage.has = originalHas
    storage.getObserver = originalGetObserver
  })

  test("test publish early return condition", () => {
    // 测试 NextStorage.ts 第105行 - 早期返回条件
    const mockEvent = {
      key: "early-return-test",
      newValue: JSON.stringify({ value: "new", expires: null }),
      oldValue: JSON.stringify({ value: "old", expires: null }),
      type: "storage",
      url: window.location.href,
      isTrusted: true,
    } as StorageEvent

    const { storage } = store as any
    const originalHas = storage.has
    const originalGetObserver = storage.getObserver

    // Mock has 方法返回 false，这样条件 !observers && !force && !this.has(observers) 为 true
    storage.has = jest.fn(() => false)
    storage.getObserver = jest.fn(() => [])

    // 调用 publish 时 observers 为空字符串，force 为 false，has 返回 false
    // 这应该触发第105行的早期返回
    const result = storage.publish("", mockEvent, false)

    expect(storage.has).toHaveBeenCalledWith("")
    expect(result).toBeUndefined() // 早期返回应该没有返回值

    // 恢复原始方法
    storage.has = originalHas
    storage.getObserver = originalGetObserver
  })

  test("test window dispatchEvent availability", () => {
    // 测试 utils.ts 第16行 - window?.dispatchEvent 的可选链
    const originalWindow = global.window
    const originalDispatchEvent = window.dispatchEvent

    // 测试 window 存在的情况
    expect(window).toBeDefined()
    expect(window.dispatchEvent).toBeDefined()

    // 测试 dispatchStorageEvent 函数
    const mockDispatchEvent = jest.fn()
    window.dispatchEvent = mockDispatchEvent

    dispatchStorageEvent({
      key: "window-test",
      newValue: "new",
      oldValue: "old",
      type: "storage",
    })

    expect(mockDispatchEvent).toHaveBeenCalled()

    // 恢复原始函数
    window.dispatchEvent = originalDispatchEvent
  })
})
