import store, { StoretifyEvent } from "../src/index"

describe("Event System", () => {
  beforeEach(() => {
    // Clear storage data and observers
    localStorage.clear()
    store.unsubscribe()
  })

  describe("Subscribe and Unsubscribe", () => {
    test("should trigger listener on value change", done => {
      let callCount = 0
      const listener = (ev: StoretifyEvent) => {
        callCount++
        if (callCount === 2) {
          expect(ev.newValue).toBe(5)
          expect(ev.oldValue).toBe(3)
          store.unsubscribe("token", listener)
          done()
        }
      }
      store.subscribe("token", listener)
      store.set("token", 3)
      store.set("token", 5)
    })

    test("should support multiple listeners on same key", () => {
      const listener1 = jest.fn()
      const listener2 = jest.fn()

      store.subscribe("multi", listener1)
      store.subscribe("multi", listener2)

      store.set("multi", "value")

      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)
    })

    test("should not trigger listener if value unchanged", () => {
      const listener = jest.fn()
      store.subscribe("unchanged", listener)

      store("unchanged", "value1")
      expect(listener).toHaveBeenCalledTimes(1)

      store("unchanged", "value1")
      expect(listener).toHaveBeenCalledTimes(1) // Still 1, not 2

      store("unchanged", "value2")
      expect(listener).toHaveBeenCalledTimes(2)
    })

    test("should trigger listener on remove", () => {
      const listener = jest.fn()
      store.set("remove-event", "value")
      store.subscribe("remove-event", listener)

      store.remove("remove-event")
      expect(listener).toHaveBeenCalled()
    })

    test("should unsubscribe specific listener", () => {
      const listener1 = jest.fn()
      const listener2 = jest.fn()

      store.subscribe("unsub-test", listener1)
      store.subscribe("unsub-test", listener2)

      // Check observers before unsubscribe
      const observersBefore = store.getObserver("unsub-test")
      expect(observersBefore).toHaveLength(2)

      // Unsubscribe listener1
      store.unsubscribe("unsub-test", listener1)

      // Check observers after unsubscribe
      const observersAfter = store.getObserver("unsub-test")
      expect(observersAfter).toHaveLength(1)
      expect(observersAfter[0]).toBe(listener2)

      // Trigger change - should only call listener2
      store.set("unsub-test", "value")

      expect(listener1).not.toHaveBeenCalled()
      expect(listener2).toHaveBeenCalled()

      // Cleanup
      store.unsubscribe("unsub-test")
    })

    test("should unsubscribe by custom listener name", () => {
      const listener1 = jest.fn()
      const listener2 = jest.fn()

      // Set custom names (not "mockConstructor")
      Object.defineProperty(listener1, "name", { value: "customListener1", writable: false })
      Object.defineProperty(listener2, "name", { value: "customListener2", writable: false })

      store.subscribe("name-match-test", listener1)
      store.subscribe("name-match-test", listener2)

      // Create a new function with the same name as listener1
      const listener1Clone = jest.fn()
      Object.defineProperty(listener1Clone, "name", { value: "customListener1", writable: false })

      // Unsubscribe by name match
      store.unsubscribe("name-match-test", listener1Clone)

      store.set("name-match-test", "value")

      // listener1 should be removed by name match
      expect(listener1).not.toHaveBeenCalled()
      // listener2 should still be called
      expect(listener2).toHaveBeenCalled()

      store.unsubscribe("name-match-test")
    })

    test("should unsubscribe by listener name", () => {
      const listener1 = jest.fn()
      const listener2 = jest.fn()

      Object.defineProperty(listener1, "name", { value: "listener1" })

      store.subscribe("name-unsub", listener1)
      store.subscribe("name-unsub", listener2)

      store.unsubscribe("name-unsub", listener1)
      store.set("name-unsub", "trigger")

      expect(listener1).not.toHaveBeenCalled()
      expect(listener2).toHaveBeenCalled()
    })

    test("should unsubscribe multiple keys at once", () => {
      const listener1 = jest.fn()
      const listener2 = jest.fn()

      store.subscribe("key1", listener1)
      store.subscribe("key2", listener2)

      store.unsubscribe(["key1", "key2"])

      store.set("key1", "value1")
      store.set("key2", "value2")

      expect(listener1).not.toHaveBeenCalled()
      expect(listener2).not.toHaveBeenCalled()
    })

    test("should unsubscribe single key by string", () => {
      const listener = jest.fn()
      store.subscribe("single-key", listener)

      store.unsubscribe("single-key")
      store.set("single-key", "value")

      expect(listener).not.toHaveBeenCalled()
    })

    test("should unsubscribe all listeners when called without arguments", () => {
      const listener1 = jest.fn()
      const listener2 = jest.fn()

      store.subscribe("all-key1", listener1)
      store.subscribe("all-key2", listener2)

      store.unsubscribe()

      store.set("all-key1", "value1")
      store.set("all-key2", "value2")

      expect(listener1).not.toHaveBeenCalled()
      expect(listener2).not.toHaveBeenCalled()
    })
  })

  describe("Event Data", () => {
    test("should provide correct event data", done => {
      store.set("event-data", "old-value")

      store.subscribe("event-data", (ev: StoretifyEvent) => {
        expect(ev.key).toBe("event-data")
        expect(ev.oldValue).toBe("old-value")
        expect(ev.newValue).toBe("new-value")
        expect(ev.type).toBe("storage")
        expect(ev.native).toBeDefined()
        done()
      })

      store.set("event-data", "new-value")
    })

    test("should handle null values in events", done => {
      store.subscribe("null-event", (ev: StoretifyEvent) => {
        expect(ev.newValue).toBe(null)
        done()
      })

      store.set("null-event", null)
    })

    test("should handle typed events", done => {
      interface User {
        name: string
        age: number
      }

      store.subscribe<User>("typed-event", (ev: StoretifyEvent<User>) => {
        if (ev.newValue) {
          expect(ev.newValue.name).toBe("Alice")
          expect(ev.newValue.age).toBe(30)
        }
        done()
      })

      store.set("typed-event", { name: "Alice", age: 30 })
    })
  })

  describe("Cross-tab Communication", () => {
    test("should handle storage events from other tabs", () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})

      const listener = jest.fn()
      store.subscribe("cross-tab", listener)

      // Simulate storage event from another tab
      const storageEvent = new StorageEvent("storage", {
        key: "cross-tab",
        newValue: JSON.stringify({ value: "from-other-tab", expires: null }),
        oldValue: null,
        url: window.location.href,
        storageArea: localStorage,
      })

      window.dispatchEvent(storageEvent)

      expect(listener).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })

    test("should handle clear events", () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})

      const listener = jest.fn()
      store.subscribe("clear-event", listener)

      store.clear()

      // Clear event should be dispatched
      expect(listener).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })
  })

  describe("Error Handling", () => {
    test("should handle errors in listener execution", () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})

      const errorListener = () => {
        throw new Error("Test error")
      }

      store.subscribe("error-listener-test", errorListener)
      store.set("error-listener-test", "trigger-error")

      expect(consoleWarnSpy).toHaveBeenCalled()
      consoleWarnSpy.mockRestore()
    })

    test("should continue executing other listeners after error", () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})

      const errorListener = () => {
        throw new Error("Test error")
      }
      const normalListener = jest.fn()

      store.subscribe("error-continue", errorListener)
      store.subscribe("error-continue", normalListener)

      store.set("error-continue", "value")

      expect(normalListener).toHaveBeenCalled()
      consoleWarnSpy.mockRestore()
    })
  })

  describe("Publish Mechanism", () => {
    test("should not publish when key does not exist and force is false", () => {
      const { storage } = store as any
      const mockEvent = {
        key: "non-existent-key",
        newValue: JSON.stringify({ value: "new", expires: null }),
        oldValue: JSON.stringify({ value: "old", expires: null }),
        type: "storage",
        url: window.location.href,
        isTrusted: true,
      } as StorageEvent

      const originalHas = storage.has
      const originalGetObserver = storage.getObserver

      storage.has = jest.fn(() => false)
      storage.getObserver = jest.fn(() => [])

      storage.publish("non-existent-key", mockEvent, false)
      expect(storage.getObserver).not.toHaveBeenCalled()

      storage.publish("non-existent-key", mockEvent, true)
      expect(storage.getObserver).toHaveBeenCalledWith("non-existent-key")

      storage.has = originalHas
      storage.getObserver = originalGetObserver
    })

    test("should publish with force parameter", () => {
      const mockListener = jest.fn()
      const mockEvent = {
        key: "force-test",
        newValue: JSON.stringify({ value: "new", expires: null }),
        oldValue: JSON.stringify({ value: "old", expires: null }),
        type: "storage",
        url: window.location.href,
        isTrusted: true,
      } as StorageEvent

      ;(store as any).storage.publish([mockListener], mockEvent, true)
      expect(mockListener).toHaveBeenCalled()
    })

    test("should publish to all observers", () => {
      const listener1 = jest.fn()
      const listener2 = jest.fn()

      store.subscribe("pub-all-1", listener1)
      store.subscribe("pub-all-2", listener2)

      const mockEvent = {
        key: null,
        newValue: null,
        oldValue: null,
        type: "storage",
        url: window.location.href,
        isTrusted: true,
      } as StorageEvent

      ;(store as any).storage.publishAll(mockEvent)

      expect(listener1).toHaveBeenCalled()
      expect(listener2).toHaveBeenCalled()
    })
  })
})
