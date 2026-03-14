import { useState } from 'react';
import store from 'storetify';
import type { StoretifyEvent } from 'storetify';

function App() {
  const [key, setKey] = useState('myKey');
  const [value, setValue] = useState('myValue');
  const [expire, setExpire] = useState(60);
  const [result, setResult] = useState('');
  const [events, setEvents] = useState<string[]>([]);
  
  const showResult = (msg: string) => {
    setResult(msg);
    setTimeout(() => setResult(''), 3000);
  };

  const handleSet = () => {
    try {
      const val = JSON.parse(value);
      store.set(key, val, expire);
      showResult(`✅ 已保存: ${key} = ${JSON.stringify(val)}`);
    } catch {
      store.set(key, value, expire);
      showResult(`✅ 已保存: ${key} = ${value}`);
    }
  };
  
  const handleGet = () => {
    const val = store.get(key);
    showResult(`📖 ${key} = ${JSON.stringify(val)}`);
  };
  
  const handleRemove = () => {
    store.remove(key);
    showResult(`🗑️ 已删除: ${key}`);
  };
  
  const handleHas = () => {
    const exists = store.has(key);
    showResult(`${exists ? '✅' : '❌'} ${key} ${exists ? '存在' : '不存在'}`);
  };
  
  const handleClear = () => {
    store.clear();
    setEvents([]);
    showResult('🧹 已清空所有数据');
  };
  
  const handleSubscribe = () => {
    const listener = (e: StoretifyEvent) => {
      const msg = `${e.key}: ${JSON.stringify(e.newValue)}`;
      setEvents(prev => [...prev.slice(-9), msg]);
    };
    store.subscribe(key, listener);
    showResult(`👂 已订阅: ${key}`);
  };
  
  const handleGetUsed = () => {
    showResult(`💾 存储占用: ${store.getUsed()}`);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Storetify Playground</h1>
      
      {/* 输入区 */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm mb-1 font-medium">Key</label>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="myKey"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium">Value (支持 JSON)</label>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder='"hello" 或 {"name":"test"} 或 [1,2,3]'
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium">过期时间(秒)</label>
            <input
              type="number"
              value={expire}
              onChange={(e) => setExpire(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>
        
        {/* 操作按钮 */}
        <div className="grid grid-cols-4 gap-2">
          <button onClick={handleSet} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">💾 Set</button>
          <button onClick={handleGet} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">📖 Get</button>
          <button onClick={handleRemove} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">🗑️ Remove</button>
          <button onClick={handleHas} className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">❓ Has</button>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-2">
          <button onClick={handleSubscribe} className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">👂 Subscribe</button>
          <button onClick={handleGetUsed} className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600">💾 GetUsed</button>
          <button onClick={handleClear} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">🧹 Clear All</button>
        </div>
      </div>
      
      {/* 结果显示 */}
      {result && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {result}
        </div>
      )}
      
      {/* 事件日志 */}
      <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm">
        <div className="text-white mb-2">📡 Storage Events (最近10条)</div>
        {events.length === 0 ? (
          <div className="text-gray-500">暂无事件，点击 Subscribe 订阅后修改数据即可看到事件</div>
        ) : (
          events.map((e, i) => <div key={i}>{e}</div>)
        )}
      </div>
      
      {/* 使用说明 */}
      <div className="mt-6 p-4 bg-blue-50 rounded text-sm">
        <h3 className="font-bold mb-2">💡 使用说明</h3>
        <ul className="space-y-1 text-gray-700">
          <li>• <b>Set</b>: 保存数据（支持字符串、数字、JSON对象/数组）</li>
          <li>• <b>Get</b>: 读取数据</li>
          <li>• <b>Remove</b>: 删除指定 key</li>
          <li>• <b>Has</b>: 检查 key 是否存在</li>
          <li>• <b>Subscribe</b>: 订阅 key 的变化事件</li>
          <li>• <b>GetUsed</b>: 查看存储占用大小</li>
          <li>• <b>Clear All</b>: 清空所有数据</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
