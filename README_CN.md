<div align="center">

# 🚀 Storetify

![Build Status](https://github.com/gvray/storetify/actions/workflows/node-ci.yml/badge.svg)
[![codecov](https://codecov.io/github/gvray/storetify/branch/main/graph/badge.svg)](https://codecov.io/github/gvray/storetify)
![license](https://img.shields.io/github/license/gvray/storetify)
![release](https://img.shields.io/github/release/gvray/storetify.svg)
[![npm version](https://img.shields.io/npm/v/storetify.svg)](https://www.npmjs.com/package/storetify)

**更好的 localStorage，支持过期时间、订阅机制和完整的 TypeScript 类型**

[English](./README.md) | [简体中文](#)

</div>

---

## ✨ 特性

- 🎯 **简单易用** - 直观的 API，就像使用原生 localStorage 一样简单
- ⏰ **过期支持** - 为存储数据设置 TTL（生存时间）
- 📡 **事件订阅** - 订阅跨标签页的存储变化
- 🔒 **类型安全** - 使用 TypeScript 构建，提供完整的类型定义
- 🪶 **轻量级** - 压缩后仅 ~2.4KB，零依赖
- 🔄 **跨标签同步** - 浏览器标签页间自动同步
- 🎨 **链式调用** - 流畅的 API，代码更优雅

## 📦 安装

```bash
# npm
npm install storetify

# yarn
yarn add storetify

# pnpm
pnpm add storetify
```

## 🚀 快速开始

```typescript
import store from 'storetify'

// 存储值
store.set('user', { name: 'Alice', age: 30 })

// 获取值
const user = store.get('user') // { name: 'Alice', age: 30 }

// 设置过期时间（秒）
store.set('token', 'abc123', 3600) // 1小时后过期

// 订阅变化
store.subscribe('user', (event) => {
  console.log('用户数据变化:', event.newValue)
})
```

## 📖 API 参考

### 基础操作

#### `store.set(key, value, expires?)`

存储一个值，可选设置过期时间。

```typescript
// 存储字符串
store.set('name', 'Alice')

// 存储对象
store.set('user', { name: 'Alice', age: 30 })

// 设置 60 秒后过期
store.set('token', 'abc123', 60)

// 链式调用
store
  .set('key1', 'value1')
  .set('key2', 'value2')
  .set('key3', 'value3')
```

**参数：**

- `key` (string): 存储键名
- `value` (StoretifyValue): 要存储的值（基本类型、对象、数组）
- `expires` (number, 可选): 过期时间（秒）

**返回值：** `StoretifyStoreStage` 支持链式调用

---

#### `store.get(key)`

获取存储的值。

```typescript
const value = store.get('name') // 'Alice'
const user = store.get<User>('user') // 带类型的返回值

// 如果键不存在或已过期，返回 null
const expired = store.get('old-key') // null
```

**参数：**

- `key` (string): 存储键名

**返回值：** `StoretifySafeValue<T>` （值或 null）

---

#### `store.remove(key)`

删除存储的值及其订阅者。

```typescript
store.remove('name')
```

**参数：**

- `key` (string): 存储键名

**返回值：** `StoretifyStoreStage` 支持链式调用

---

#### `store.clear()`

清除所有存储的值。

```typescript
store.clear()
```

---

#### `store.has(key)`

检查键是否存在（不考虑过期）。

```typescript
if (store.has('user')) {
  console.log('用户存在')
}
```

**参数：**

- `key` (string): 存储键名

**返回值：** `boolean`

---

### 简写语法

```typescript
// 读取
const value = store('key')

// 写入
store('key', 'value')

// 带过期时间写入
store('key', 'value', 3600)

// 删除
store('key', undefined)

// 惰性求值
store('computed', () => expensiveCalculation())
```

---

### 事件订阅

#### `store.subscribe(key, listener)`

订阅特定键的变化。

```typescript
const listener = (event: StoretifyEvent) => {
  console.log('键名:', event.key)
  console.log('旧值:', event.oldValue)
  console.log('新值:', event.newValue)
}

store.subscribe('user', listener)
```

**事件对象：**

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

取消订阅存储变化。

```typescript
// 取消特定监听器
store.unsubscribe('user', listener)

// 取消键的所有监听器
store.unsubscribe('user')

// 取消多个键
store.unsubscribe(['user', 'settings'])

// 取消所有订阅
store.unsubscribe()
```

---

### 工具方法

#### `store.getUsed()`

获取当前存储使用量。

```typescript
const usage = store.getUsed() // "2.345 KB"
```

**返回值：** `string` - 存储使用量（KB）

---

#### `store.getObserver(key)`

获取特定键的所有监听器。

```typescript
const observers = store.getObserver('user')
console.log(`已注册 ${observers.length} 个监听器`)
```

**返回值：** `StoretifyListener[]`

---

## 🎯 TypeScript 支持

Storetify 使用 TypeScript 构建，提供完整的类型安全。

### 类型定义

```typescript
import type { 
  Storetify,
  StoretifyValue,
  StoretifySafeValue,
  StoretifyEvent,
  StoretifyListener 
} from 'storetify'

// 自定义类型
interface User {
  name: string
  age: number
}

// 类型安全的存储
store.set<User>('user', { name: 'Alice', age: 30 })
const user = store.get<User>('user')

// 类型安全的事件
store.subscribe<User>('user', (event: StoretifyEvent<User>) => {
  if (event.newValue) {
    console.log(event.newValue.name) // TypeScript 知道这是 string 类型
  }
})
```

### 支持的类型

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

## 💡 高级用法

### 跨标签通信

Storetify 自动在浏览器标签页间同步变化。

```typescript
// 标签页 1
store.set('theme', 'dark')

// 标签页 2（自动接收更新）
store.subscribe('theme', (event) => {
  console.log('主题变更为:', event.newValue)
  applyTheme(event.newValue)
})
```

### 过期处理

```typescript
// 设置 5 分钟过期的数据
store.set('session', { token: 'abc123' }, 300)

// 5 分钟后
const session = store.get('session') // null（自动过期）

// 注意：has() 对过期项也返回 true
store.has('session') // true（键存在于存储中）
store.get('session') // null（但值已过期）
```

### 函数值（惰性求值）

```typescript
// 设置时计算值
store.set('timestamp', () => Date.now())

// 适用于昂贵的计算
store.set('data', () => {
  return expensiveCalculation()
})
```

### 链式调用

```typescript
store
  .set('user', { name: 'Alice' })
  .set('theme', 'dark')
  .subscribe('user', handleUserChange)
  .subscribe('theme', handleThemeChange)
```

---

## 🌐 浏览器支持

Storetify 支持所有支持 localStorage 的浏览器。

| 浏览器 | 版本 |
|--------|------|
| Chrome | 4+ |
| Firefox | 3.5+ |
| Safari | 4+ |
| Edge | 全部 |
| IE | 8+ |
| iOS Safari | 3.2+ |
| Android Browser | 2.1+ |

---

## 🔧 开发

```bash
# 安装依赖
pnpm install

# 运行测试
pnpm test

# 构建
pnpm build

# 代码检查
pnpm lint
```

---

## 📄 许可证

MIT © [Gavin Ray](https://github.com/gvray)

---

## 🤝 贡献

欢迎贡献！请随时提交 Pull Request。

---

## 📚 相关资源

- [localStorage MDN 文档](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/localStorage)
- [Storage Event](https://developer.mozilla.org/zh-CN/docs/Web/API/StorageEvent)

---

<div align="center">

用 ❤️ 制作 by [Gavin Ray](https://github.com/gvray)

</div>
