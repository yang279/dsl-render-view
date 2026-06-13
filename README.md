# dsl-render-view

DSL 语义节点线框图渲染与编辑工具。将描述 UI 页面布局的 JSON 语义节点树渲染为交互式线框图，支持选中节点并编辑其语义标注。

## 功能

- **线框图渲染**：将 DSL JSON 渲染为彩色线框块，按 `layerType`（frame / component / text / image / icon）区分颜色，带视口裁剪和横向缩放
- **节点编辑**：点击线框块弹出编辑面板，可修改 `layerType`、`layerName`、`layerDescription`
- **DSL 上传/下载**：上传 JSON 文件加载节点树，下载编辑后的 JSON
- **ZIP 预览**：上传含 `.txt` 文件的 ZIP 包，在 iframe 中预览
- **URL 预览**：直接输入 URL 在 iframe 中加载页面

## 全局接口

本工具设计为嵌入宿主应用（如 WebView）使用，通过 `window` 全局函数交互：

| 函数 | 说明 |
|---|---|
| `window.uploadDsl()` | 触发文件选择器，上传 `.json` DSL 文件 |
| `window.downloadDsl()` | 将当前节点树导出为 JSON 下载 |
| `window.uploadZip()` | 触发文件选择器，上传 `.zip` 压缩包进行预览 |

## DSL 格式

DSL 为嵌套 JSON 节点树，每个节点包含：

- `nid` — 节点唯一 ID
- `tag` — HTML 标签名
- `rect` — 绝对坐标和尺寸 `{ x, y, w, h }`
- `layerType` — 语义图层类型（frame / component / text / image / icon）
- `layerName` — 语义简短名称
- `layerDescription` — 语义详细描述
- `style` — 内联精简样式
- `children` — 子节点列表

详见 [node-dsl.md](./node-dsl.md) 中的完整 Schema 定义。

## 技术栈

- Vue 3 + JSX
- TypeScript
- Vite
- Pinia（状态管理）
- Vue Router
- Element Plus（编辑面板组件）
- Tailwind CSS 4
- JSZip（ZIP 解压）

## 开发

```bash
npm install
npm run dev
```

构建：

```bash
npm run build
```
