# iframe 消息协议

本应用通过 `postMessage` 与父 frame 通信。所有消息格式为 `{ type: string, payload?: any }`。

---

## 入站消息（父 frame → 本应用）

### NODE_DSL_JSON

加载 DSL 数据到线框编辑器，不触发 pipeline。

- **payload**: `DslNode` 对象（见下方 DslNode 格式）
- **响应**: 发出 `NODE_DSL_LOADED` 消息

```
iframe.contentWindow.postMessage({
  type: 'NODE_DSL_JSON',
  payload: { nid: 1, tag: 'div', rect: {...}, children: [...] }
}, '*')
```

### NODE_DSL_PIPELINE

将 DSL JSON 发送到 dsl-to-hex API，获取 ZIP 后解压加载到 previewStore，iframe ready 时自动执行 Pixso 插件。不加载线框编辑器。

- **payload**: `DslNode` 对象（同 NODE_DSL_JSON 的 payload 格式）
- **响应**: 发出 `PIPELINE_LOADED` 消息。API 成功时 payload 包含 `zipData`；API 失败（网络异常、非 ok 响应、响应缺 zip）时 payload 为 `{ success: false, error }`，不含 zipData。

```
iframe.contentWindow.postMessage({
  type: 'NODE_DSL_PIPELINE',
  payload: { nid: 1, tag: 'div', rect: {...}, children: [...] }
}, '*')
```

### NODE_DSL_CLEAR

清空线框编辑器数据。

- **payload**: 无

```
iframe.contentWindow.postMessage({
  type: 'NODE_DSL_CLEAR'
}, '*')
```

### PIPELINE_ZIP_DATA

父 frame 直接传入 ZIP 二进制数据，应用解压后加载到 previewStore，iframe ready 时自动执行 Pixso 插件。

- **payload**: `ArrayBuffer`（ZIP 二进制数据），通过 Transferable 零拷贝传输，发送方 postMessage 后不可再访问该 buffer
- **响应**: 发出 `ZIP_LOADED` 消息（成功或失败）

```
const buffer = await fetch('example.zip').then(r => r.arrayBuffer())
iframe.contentWindow.postMessage(
  { type: 'PIPELINE_ZIP_DATA', payload: buffer },
  '*',
  [buffer]  // Transferable：零拷贝转移，发送方此后不可再访问此 buffer
)
```

---

## 出站消息（本应用 → 父 frame）

### NODE_DSL_LOADED

`NODE_DSL_JSON` 处理完成后发出，表示线框加载结果。

- **payload（成功）**: `{ success: true }`
- **payload（失败）**: `{ success: false, error: string }`

```json
// 成功
{ "type": "NODE_DSL_LOADED", "payload": { "success": true } }

// 失败
{ "type": "NODE_DSL_LOADED", "payload": { "success": false, "error": "..." } }
```

### PIPELINE_LOADED

`NODE_DSL_PIPELINE` 处理完成后发出。

- **payload（成功）**: `{ success: true, zipData: ArrayBuffer }` — `zipData` 为远程 API 返回的 ZIP 二进制数据（通过 Transferable 零拷贝传输）
- **payload（失败）**: `{ success: false, error: string }` — API 请求失败、响应非 ok 或返回数据缺 zip 时，不含 `zipData`

```json
// 成功
{ "type": "PIPELINE_LOADED", "payload": { "success": true, "zipData": "<ArrayBuffer>" } }

// 失败
{ "type": "PIPELINE_LOADED", "payload": { "success": false, "error": "..." } }
```

### DSL_NODE_UPDATED

编辑器中节点元数据被修改时发出。

- **payload**: `{ nid: number, changes: { layerType: string, layerName: string, layerDescription: string } }`

```json
{
  "type": "DSL_NODE_UPDATED",
  "payload": {
    "nid": 3,
    "changes": {
      "layerType": "text",
      "layerName": "标题",
      "layerDescription": "页面主标题"
    }
  }
}
```

### ZIP_LOADED

`PIPELINE_ZIP_DATA` 处理完成后发出，表示 ZIP 解压和加载结果。

- **payload（成功）**: `{ success: true, zipData: ArrayBuffer }` — `zipData` 为原始 ZIP 二进制数据副本（通过 Transferable 零拷贝传输回父 frame）
- **payload（失败）**: `{ success: false, error: string }` — 不含 `zipData`

```json
// 成功
{ "type": "ZIP_LOADED", "payload": { "success": true, "zipData": "<ArrayBuffer>" } }

// 失败
{ "type": "ZIP_LOADED", "payload": { "success": false, "error": "..." } }
```

---

## DslNode 对象格式

```json
{
  "nid": 1,
  "tag": "div",
  "rect": { "x": 0, "y": 0, "w": 375, "h": 812 },
  "layerType": "frame | component | text | image | icon",
  "layerName": "",
  "layerDescription": "",
  "style": {},
  "children": [
    { "nid": 2, "tag": "img", "rect": { "x": 10, "y": 10, "w": 100, "h": 100 }, "layerType": "image", "src": "...", ... },
    { "nid": 3, "tag": "span", "rect": { "x": 10, "y": 120, "w": 200, "h": 20 }, "layerType": "text", "text": "Hello", ... }
  ]
}
```

---

## 父 frame 监听示例

```js
window.addEventListener('message', (e) => {
  const data = e.data

  // 线框加载结果
  if (data?.type === 'NODE_DSL_LOADED') {
    if (data.payload.success) {
      console.log('线框加载成功')
    } else {
      console.error('线框加载失败:', data.payload.error)
    }
  }

  // Pipeline 结果
  if (data?.type === 'PIPELINE_LOADED') {
    if (data.payload.success) {
      console.log('Pipeline 处理成功，插件已自动执行')
      const zipData = data.payload.zipData  // ArrayBuffer，可用于 JSZip 等进一步处理
    } else {
      console.error('Pipeline 处理失败:', data.payload.error)
    }
  }

  // ZIP 直接上传结果
  if (data?.type === 'ZIP_LOADED') {
    if (data.payload.success) {
      console.log('ZIP 加载成功')
      const zipData = data.payload.zipData  // ArrayBuffer
    } else {
      console.error('ZIP 加载失败:', data.payload.error)
    }
  }

  // 节点元数据更新
  if (data?.type === 'DSL_NODE_UPDATED') {
    console.log(`节点 ${data.payload.nid} 更新:`, data.payload.changes)
  }
})
```

## 消息流程图

```
NODE_DSL_JSON ──→ 加载线框 ──→ NODE_DSL_LOADED

NODE_DSL_PIPELINE ──→ dsl-to-hex API ──成功──→ ZIP 解压 ──→ previewStore ──→ auto runPlugin ──→ PIPELINE_LOADED { success: true, zipData }
                     │
                     └─ (失败) ──→ PIPELINE_LOADED { success: false, error }

PIPELINE_ZIP_DATA ──→ ZIP 解压 ──→ previewStore ──→ auto runPlugin ──→ ZIP_LOADED { success: true, zipData }
                     │
                     └─ (解压失败) ──→ ZIP_LOADED { success: false, error }

编辑器修改节点 ──→ DSL_NODE_UPDATED

NODE_DSL_CLEAR ──→ 清空线框
```
