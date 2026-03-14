import { jsonParse, dispatchStorageEvent, getGlobal, isValidKey } from "../src/utils"
import store from "../src/index"

describe("Utility Functions", () => {
  beforeEach(() => {
    store.clear()
  })

  describe("Global Environment Detection", () => {
    test("should detect global object", () => {
      const global = getGlobal()
      expect(global).toBeDefined()
      // In test environment, should have window
      expect(global).toBe(window)
    })
  })

  describe("Key Validation", () => {
    test("should warn for invalid key types", () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})

      // Test with non-string key
      isValidKey(123 as any)

      expect(consoleWarnSpy).toHaveBeenCalledWith("store failed, entry a valid string key.")
      consoleWarnSpy.mockRestore()
    })
  })

  describe("jsonParse", () => {
    test("should parse valid JSON strings", () => {
      const validJson = JSON.stringify({ value: "test", expires: null })
      const result = jsonParse(validJson)

      expect(result).toEqual({ value: "test", expires: null })
    })

    test("should handle null input", () => {
      const result = jsonParse(null)
      expect(result).toBe(null)
    })

    test("should handle undefined string", () => {
      const result = jsonParse("undefined")
      expect(result).toBe(null)
    })

    test("should handle undefined input", () => {
      const result = jsonParse(undefined as any)
      expect(result).toBe(null)
    })

    test("should handle invalid JSON gracefully", () => {
      const invalidJson = "invalid-json"
      const result = jsonParse(invalidJson)

      expect(result).toBe(null)
    })

    test("should handle malformed JSON", () => {
      const malformedJson = '{"incomplete":'
      const result = jsonParse(malformedJson)

      expect(result).toBe(null)
    })

    test("should parse complex nested structures", () => {
      const complex = JSON.stringify({
        value: {
          user: { name: "Alice", data: [1, 2, 3] },
          settings: { theme: "dark" },
        },
        expires: 1234567890,
      })

      const result = jsonParse(complex)
      expect(result).toEqual({
        value: {
          user: { name: "Alice", data: [1, 2, 3] },
          settings: { theme: "dark" },
        },
        expires: 1234567890,
      })
    })
  })

  describe("dispatchStorageEvent", () => {
    test("should dispatch storage event with correct data", () => {
      const listener = jest.fn()

      window.addEventListener("storage", listener)

      dispatchStorageEvent({
        key: "test-key",
        newValue: "new",
        oldValue: "old",
        type: "storage",
      })

      expect(listener).toHaveBeenCalled()

      const event = listener.mock.calls[0][0] as StorageEvent
      expect(event.key).toBe("test-key")
      expect(event.newValue).toBe("new")
      expect(event.oldValue).toBe("old")
      expect(event.type).toBe("storage")

      window.removeEventListener("storage", listener)
    })

    test("should dispatch event with null values", () => {
      const listener = jest.fn()

      window.addEventListener("storage", listener)

      dispatchStorageEvent({
        key: null,
        newValue: null,
        oldValue: null,
        type: "storage",
      })

      expect(listener).toHaveBeenCalled()

      const event = listener.mock.calls[0][0] as StorageEvent
      expect(event.key).toBe(null)
      expect(event.newValue).toBe(null)
      expect(event.oldValue).toBe(null)

      window.removeEventListener("storage", listener)
    })

    test("should include url and storageArea in event", () => {
      const listener = jest.fn()

      window.addEventListener("storage", listener)

      dispatchStorageEvent({
        key: "url-test",
        newValue: "value",
        oldValue: null,
        type: "storage",
      })

      const event = listener.mock.calls[0][0] as StorageEvent
      expect(event.url).toBeDefined()
      expect(event.storageArea).toBe(localStorage)

      window.removeEventListener("storage", listener)
    })
  })

  describe("Error Handling in Utils", () => {
    test("should handle invalid JSON in event parsing", () => {
      const mockListener = jest.fn()
      const mockEvent = {
        key: "error-test",
        newValue: "invalid-json",
        oldValue: "also-invalid",
        type: "storage",
        url: window.location.href,
        isTrusted: true,
      } as StorageEvent

      ;(store as any).storage.publish([mockListener], mockEvent, true, "error-test")

      // jsonParse now has try-catch, so listener should still be called with null values
      expect(mockListener).toHaveBeenCalled()
    })

    test("should continue after JSON parse errors", () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})

      const listener1 = jest.fn()
      const listener2 = jest.fn()

      store.subscribe("parse-error", listener1)
      store.subscribe("parse-error", listener2)

      // Use dispatchStorageEvent instead of window.dispatchEvent
      dispatchStorageEvent({
        key: "parse-error",
        newValue: "{invalid}",
        oldValue: null,
        type: "storage",
      })

      // Both listeners should be called despite parse error
      expect(listener1).toHaveBeenCalled()
      expect(listener2).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })
  })

  describe("Window Object Availability", () => {
    test("should have window object available", () => {
      expect(window).toBeDefined()
      expect(window.dispatchEvent).toBeDefined()
      expect(window.location).toBeDefined()
      expect(window.localStorage).toBeDefined()
    })

    test("should have location.href available", () => {
      expect(window.location.href).toBeDefined()
      expect(typeof window.location.href).toBe("string")
    })
  })

  describe("JSON Parsing Edge Cases", () => {
    test("should handle empty string", () => {
      const result = jsonParse("")
      expect(result).toBe(null)
    })

    test("should handle whitespace", () => {
      const result = jsonParse("   ")
      expect(result).toBe(null)
    })

    test("should parse valid primitive JSON", () => {
      expect(jsonParse('"string"')).toBe("string")
      expect(jsonParse("123")).toBe(123)
      expect(jsonParse("true")).toBe(true)
      expect(jsonParse("false")).toBe(false)
      expect(jsonParse("null")).toBe(null)
    })

    test("should parse arrays", () => {
      const result = jsonParse("[1, 2, 3]")
      expect(result).toEqual([1, 2, 3])
    })

    test("should parse empty objects and arrays", () => {
      expect(jsonParse("{}")).toEqual({})
      expect(jsonParse("[]")).toEqual([])
    })
  })
})
