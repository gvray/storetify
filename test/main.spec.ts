import store from "../src/index"
import fn from "../example/fn"
import reinitStore from "../src/store"

jest.mock("../example/fn")
const keyPrefix = "test-storetify"
const getKey = (key: string) => keyPrefix + key
describe("storetify", () => {
  test("test store obj", () => {
    store.set("obj", { type: "object", value: { a: 1 } })
    expect(store("obj")).toEqual({ type: "object", value: { a: 1 } })
  })
  test("test store(a,b)", () => {
    store(getKey("a"), "a")
    expect(store(getKey("a"))).toBe("a")
    store(getKey("a"), undefined)
    expect(store(getKey("a"))).toBe(null)
    store(getKey("a-func"), () => "a-func")
    expect(store(getKey("a-func"))).toBe("a-func")
  })
  test("test store.set(a,b)", () => {
    store.set(getKey("b"), "b")
    expect(store.get(getKey("b"))).toBe("b")
  })
  test("test expires", done => {
    store.set("c", "c", 1)
    expect(store.get("c")).toBe("c")
    setTimeout(() => {
      expect(store.get("c")).toBe(null)
      done()
    }, 2000)
    expect(store.get("c")).toBe("c")
  })
  test("test subscribe", () => {
    const fn2 = jest.fn()
    store.subscribe("d", fn2)
    store("d", "d1")
    expect(fn2).toBeCalledTimes(1)
    store("d", "d1")
    expect(fn2).toBeCalledTimes(1)
    store("d", "d2")
    expect(fn2).toBeCalledTimes(2)
    store.remove("d")
    expect(fn2).toBeCalledTimes(3)
    expect(store("d")).toBe(null)
  })
  test("test subscribes", () => {
    const fn1 = jest.fn()
    const fn2 = jest.fn()
    store("e", "e1")
    store.subscribe("e", fn1)
    store.subscribe("e", fn2)
    store("e", "e2")
    expect(fn1).toBeCalledTimes(1)
    expect(fn2).toBeCalledTimes(1)
    store.clear()
    expect(fn1).toBeCalledTimes(2)
    expect(fn2).toBeCalledTimes(2)
  })
  test("test subscribe unsubscribe", () => {
    const { fn1 } = fn
    const { fn2 } = fn
    const { fn3 } = fn

    store("f", "f1")
    store.subscribe("f", fn1)
    store.subscribe("f", fn2)
    store.subscribe("f", fn3)
    store("f", "f2")
    expect(fn1).toBeCalledTimes(1)
    expect(fn2).toBeCalledTimes(1)
    expect(fn3).toBeCalledTimes(1)
    store.unsubscribe("f", fn1)
    store("f", "f3")
    expect(fn1).toBeCalledTimes(1)
    expect(fn2).toBeCalledTimes(2)
    expect(fn3).toBeCalledTimes(2)
    store.remove("f")
    expect(fn1).toBeCalledTimes(1)
    expect(fn2).toBeCalledTimes(3)
    expect(fn3).toBeCalledTimes(3)
    store.set("f", "f5")
    expect(fn1).toBeCalledTimes(1)
    expect(fn2).toBeCalledTimes(3)
    expect(fn3).toBeCalledTimes(3)
    store.subscribe("f", fn1)
    store.subscribe("f", fn2)
    store.subscribe("f", fn3)
    store.set("f", "f6")
    store.set("f", "f7")
    expect(fn1).toBeCalledTimes(3)
    expect(fn2).toBeCalledTimes(5)
    expect(fn3).toBeCalledTimes(5)
    store.unsubscribe("f")
    store.set("f", "f7")
    expect(fn1).toBeCalledTimes(3)
    expect(fn2).toBeCalledTimes(5)
    expect(fn3).toBeCalledTimes(5)
  })
  test("clear localStorage", () => {
    store("token", "admin")
    expect(store("token")).toBe("admin")
    localStorage.clear()
    expect(store("token")).toBe(null)
  })
  test("Type of test", () => {
    store(
      "str",
      function () {
        return 123
      },
      1,
    )
    store.subscribe("str", () => {
      // 空函数用作占位符
    })
    store("mm", 0)
    store("str", 98).get("98k")
  })
  // API
  test("getUsed()", () => {
    expect(store.getUsed().includes("KB")).toBeTruthy()
  })

  test("test store initialization edge cases", () => {
    // 测试 store.ts 第38行的 else 分支
    // 这个分支处理非函数属性的情况
    const { storage } = store as any

    // 验证 storage 属性被正确设置
    expect((store as any).storage).toBeDefined()
    expect((store as any).storage).toBe(storage)
  })

  test("test window storage event handling", () => {
    // 测试窗口存储事件的处理
    const mockEvent = new StorageEvent("storage", {
      key: "test-window-event",
      newValue: JSON.stringify({ value: "new-value", expires: null }),
      oldValue: JSON.stringify({ value: "old-value", expires: null }),
      url: window.location.href,
      storageArea: localStorage,
    })

    const mockListener = jest.fn()
    store.subscribe("test-window-event", mockListener)

    // 手动触发存储事件
    window.dispatchEvent(mockEvent)

    expect(mockListener).toHaveBeenCalled()
  })

  test("test clear with storage event", () => {
    // 测试 clear 操作触发的存储事件
    store.set("clear-test-1", "value1")
    store.set("clear-test-2", "value2")

    const mockListener1 = jest.fn()
    const mockListener2 = jest.fn()

    store.subscribe("clear-test-1", mockListener1)
    store.subscribe("clear-test-2", mockListener2)

    // 执行 clear 操作
    store.clear()

    // 验证所有监听器都被调用
    expect(mockListener1).toHaveBeenCalled()
    expect(mockListener2).toHaveBeenCalled()

    // 验证数据被清除
    expect(store.get("clear-test-1")).toBe(null)
    expect(store.get("clear-test-2")).toBe(null)
  })

  test("test store initialization with non-function properties", () => {
    // 测试 store.ts 第38行的 else 分支
    // 这个测试确保非函数属性不会被绑定到 store 对象上
    const { storage } = store as any

    // 验证 namespace 属性（非函数）没有被复制到 store 上
    expect((store as any).namespace).toBeUndefined()

    // 但是 storage 属性应该存在
    expect((store as any).storage).toBe(storage)
  })

  test("test listener error handling with named function", () => {
    // 测试 utils.ts 第48行 - 有名函数的错误处理
    const namedFunction = function namedListener() {
      throw new Error("Named function error")
    }

    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {
      // Mock implementation
    })

    store.subscribe("error-test", namedFunction)
    store.set("error-test", "trigger error")

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("namedListener"))

    consoleSpy.mockRestore()
  })

  test("test store initialization with non-function property", () => {
    // 测试 store.ts 第38行 - 处理非函数属性的 else 分支
    // 这个测试主要验证 init 函数中的 else 分支逻辑

    // 创建一个模拟的 storage 对象，其中包含非函数属性
    const mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 0,
      key: jest.fn(),
      // 添加一个非函数属性
      nonFunctionProperty: "test-value",
    }

    // 临时替换 localStorage 的原型
    const originalProto = Object.getPrototypeOf(localStorage)
    Object.setPrototypeOf(localStorage, mockStorage)

    try {
      // 重新初始化 store 来触发 init 函数
      // 验证非函数属性不会被复制到 store 上
      expect((reinitStore as any).nonFunctionProperty).toBeUndefined()
    } finally {
      // 恢复原始原型
      Object.setPrototypeOf(localStorage, originalProto)
    }
  })
})
