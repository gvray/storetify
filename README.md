<div align="center">

# 🚀 Storetify

![Build Status](https://github.com/gvray/storetify/actions/workflows/node-ci.yml/badge.svg)
[![codecov](https://codecov.io/github/gvray/storetify/branch/main/graph/badge.svg)](https://codecov.io/github/gvray/storetify)
![license](https://img.shields.io/github/license/gvray/storetify)
![release](https://img.shields.io/github/release/gvray/storetify.svg)
[![npm version](https://img.shields.io/npm/v/storetify.svg)](https://www.npmjs.com/package/storetify)

**Better localStorage with expiration, subscription, and full TypeScript support**

[English](#) | [简体中文](./README_CN.md)

</div>

---

## ✨ Features

- 🎯 **Simple API** - Intuitive and easy to use, just like native localStorage
- ⏰ **Expiration Support** - Set TTL (time-to-live) for stored data
- 📡 **Event Subscription** - Subscribe to storage changes across tabs
- 🔒 **Type Safe** - Built with TypeScript, full type definitions included
- 🪶 **Lightweight** - Only ~2.4KB gzipped, zero dependencies
- 🔄 **Cross-tab Sync** - Automatic synchronization across browser tabs
- 🎨 **Method Chaining** - Fluent API for elegant code

## 📦 Installation

```bash
# npm
npm install storetify

# yarn
yarn add storetify

# pnpm
pnpm add storetify
```

## 🚀 Quick Start

```typescript
import store from 'storetify'

// Store a value
store.set('user', { name: 'Alice', age: 30 })

// Get a value
const user = store.get('user') // { name: 'Alice', age: 30 }

// Set with expiration (in seconds)
store.set('token', 'abc123', 3600) // Expires in 1 hour

// Subscribe to changes
store.subscribe('user', (event) => {
  console.log('User changed:', event.newValue)
})
```

## 📖 API Reference

### Basic Operations

#### `store.set(key, value, expires?)`

Store a value with optional expiration time.

```typescript
// Store a string
store.set('name', 'Alice')

// Store an object
store.set('user', { name: 'Alice', age: 30 })

// Store with 60 seconds expiration
store.set('token', 'abc123', 60)

// Method chaining
store
  .set('key1', 'value1')
  .set('key2', 'value2')
  .set('key3', 'value3')
```

**Parameters:**

- `key` (string): Storage key
- `value` (StoretifyValue): Value to store (primitives, objects, arrays)
- `expires` (number, optional): Expiration time in seconds

**Returns:** `StoretifyStoreStage` for method chaining

---

#### `store.get(key)`

Retrieve a stored value.

```typescript
const value = store.get('name') // 'Alice'
const user = store.get<User>('user') // Typed return value

// Returns null if key doesn't exist or has expired
const expired = store.get('old-key') // null
```

**Parameters:**

- `key` (string): Storage key

**Returns:** `StoretifySafeValue<T>` (value or null)

---

#### `store.remove(key)`

Remove a stored value and its subscribers.

```typescript
store.remove('name')
```

**Parameters:**

- `key` (string): Storage key

**Returns:** `StoretifyStoreStage` for method chaining

---

#### `store.clear()`

Clear all stored values.

```typescript
store.clear()
```

---

#### `store.has(key)`

Check if a key exists (regardless of expiration).

```typescript
if (store.has('user')) {
  console.log('User exists')
}
```

**Parameters:**

- `key` (string): Storage key

**Returns:** `boolean`

---

### Shorthand Syntax

```typescript
// Read
const value = store('key')

// Write
store('key', 'value')

// Write with expiration
store('key', 'value', 3600)

// Delete
store('key', undefined)

// Lazy evaluation
store('computed', () => expensiveCalculation())
```

---

### Event Subscription

#### `store.subscribe(key, listener)`

Subscribe to changes for a specific key.

```typescript
const listener = (event: StoretifyEvent) => {
  console.log('Key:', event.key)
  console.log('Old value:', event.oldValue)
  console.log('New value:', event.newValue)
}

store.subscribe('user', listener)
```

**Event Object:**

```typescript
interface StoretifyEvent<T = StoretifyValue> {
  key: string | null
  oldValue: T | null
  newValue: T | null
  type: string
  url: string
  native: StorageEvent
}
```

---

#### `store.unsubscribe(keys?, listener?)`

Unsubscribe from storage changes.

```typescript
// Unsubscribe specific listener
store.unsubscribe('user', listener)

// Unsubscribe all listeners for a key
store.unsubscribe('user')

// Unsubscribe multiple keys
store.unsubscribe(['user', 'settings'])

// Unsubscribe all
store.unsubscribe()
```

---

### Utility Methods

#### `store.getUsed()`

Get current storage usage.

```typescript
const usage = store.getUsed() // "2.345 KB"
```

**Returns:** `string` - Storage usage in KB

---

#### `store.getObserver(key)`

Get all listeners for a specific key.

```typescript
const observers = store.getObserver('user')
console.log(`${observers.length} listeners registered`)
```

**Returns:** `StoretifyListener[]`

---

## 🎯 TypeScript Support

Storetify is built with TypeScript and provides full type safety.

### Type Definitions

```typescript
import type { 
  Storetify,
  StoretifyValue,
  StoretifySafeValue,
  StoretifyEvent,
  StoretifyListener 
} from 'storetify'

// Custom types
interface User {
  name: string
  age: number
}

// Type-safe storage
store.set<User>('user', { name: 'Alice', age: 30 })
const user = store.get<User>('user')

// Type-safe events
store.subscribe<User>('user', (event: StoretifyEvent<User>) => {
  if (event.newValue) {
    console.log(event.newValue.name) // TypeScript knows this is a string
  }
})
```

### Supported Types

```typescript
type StoretifyValue = 
  | string 
  | number 
  | boolean 
  | null 
  | JSONObject 
  | JSONArray

interface JSONObject {
  [key: string]: StoretifyValue
}

type JSONArray = Array<StoretifyValue>
```

---

## 💡 Advanced Usage

### Cross-tab Communication

Storetify automatically synchronizes changes across browser tabs.

```typescript
// Tab 1
store.set('theme', 'dark')

// Tab 2 (automatically receives the update)
store.subscribe('theme', (event) => {
  console.log('Theme changed to:', event.newValue)
  applyTheme(event.newValue)
})
```

### Expiration Handling

```typescript
// Set data with 5-minute expiration
store.set('session', { token: 'abc123' }, 300)

// After 5 minutes
const session = store.get('session') // null (automatically expired)

// Note: has() returns true even for expired items
store.has('session') // true (key exists in storage)
store.get('session') // null (but value is expired)
```

### Function Values (Lazy Evaluation)

```typescript
// Value is computed when set
store.set('timestamp', () => Date.now())

// Useful for expensive computations
store.set('data', () => {
  return expensiveCalculation()
})
```

### Method Chaining

```typescript
store
  .set('user', { name: 'Alice' })
  .set('theme', 'dark')
  .subscribe('user', handleUserChange)
  .subscribe('theme', handleThemeChange)
```

---

## 🌐 Browser Support

Storetify works in all browsers that support localStorage.

| Browser | Version |
|---------|---------|
| Chrome | 4+ |
| Firefox | 3.5+ |
| Safari | 4+ |
| Edge | All |
| IE | 8+ |
| iOS Safari | 3.2+ |
| Android Browser | 2.1+ |

---

## 🔧 Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build
pnpm build

# Lint
pnpm lint
```

---

## 📄 License

MIT © [Gavin Ray](https://github.com/gvray)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📚 Related

- [localStorage MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Storage Event](https://developer.mozilla.org/en-US/docs/Web/API/StorageEvent)

---

<div align="center">

Made with ❤️ by [Gavin Ray](https://github.com/gvray)

</div>
