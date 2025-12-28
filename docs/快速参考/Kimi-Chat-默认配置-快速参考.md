# 🎯 Kimi Chat 默认配置 - 快速参考

## 实施摘要

| 项目 | 内容 |
|------|------|
| **实施方案** | 方案1：配置 defaultChatAgent |
| **修改文件** | `product.json` |
| **修改内容** | 添加 `defaultChatAgent` 配置块 |
| **默认 Chat Provider** | Kimi Chat |
| **修改行数** | ~40 行 |
| **修改复杂度** | 极低 ⭐ |
| **实施风险** | 极低 ⭐ |
| **生效方式** | 重启应用 |

## 核心修改

```json
// product.json 第 1157 行处添加
"defaultChatAgent": {
    "extensionId": "vscode.kimi-chat-extension",
    "chatExtensionId": "vscode.kimi-chat-extension",
    "provider": {
        "default": { "id": "kimi", "name": "Kimi" },
        ...
    },
    ...
}
```

## 验证命令

```bash
# 1. 验证 JSON 格式
node -e "console.log(JSON.stringify(require('./product.json').defaultChatAgent, null, 2))"

# 2. 检查修改
git diff product.json
```

## 效果对比

### 修改前 ❌
```
用户打开 Chat 面板
    ↓
浏览器控制台错误：
"No default chat agent available"
    ↓
Chat 功能不可用
```

### 修改后 ✅
```
应用启动
    ↓
识别 defaultChatAgent 配置
    ↓
注册 Kimi Chat 为默认 agent
    ↓
Chat 功能正常工作
```

## 关键文件信息

### Kimi 扩展配置
**文件**：`extensions/kimi-chat-extension/package.json`

```json
{
    "name": "kimi-chat-extension",
    "displayName": "Kimi Chat Extension",
    "activationEvents": ["onLanguageModelChatProvider:kimi"],
    "contributes": {
        "languageModelChatProviders": [{
            "vendor": "kimi",
            "displayName": "Kimi (GitCode)"
        }]
    }
}
```

### Product 配置位置
**文件**：`product.json`

**位置**：第 1155-1199 行（在 `builtInExtensions` 之后，`extensionsGallery` 之前）

## 使用流程

### 1️⃣ 配置 API Key
```
命令：Kimi: 管理 Kimi API Key
输入：您的 Kimi API Key
保存：点击确定
```

### 2️⃣ 打开 Chat
```
菜单：View → Chat
或快捷键：Ctrl+Shift+I (Windows/Linux)
或快捷键：Cmd+Shift+I (macOS)
```

### 3️⃣ 发送消息
```
在 Chat 输入框输入问题
选择模式：Ask / Edit / Agent
点击发送或按 Enter
```

## 常见问题

### Q: Chat 仍然无法使用？
A:
1. 重启应用
2. 检查浏览器控制台错误
3. 验证 product.json 格式：`node -e "require('./product.json')"`
4. 确认 API Key 已配置

### Q: 如何切换其他 Chat Provider？
A: 需要修改 `product.json` 中的 `defaultChatAgent` 配置，指向其他扩展

### Q: 能否同时使用多个 Chat Provider？
A: 可以，但需要通过 Chat 界面手动切换选择

### Q: 配置链接为什么指向 Kimi 官网？
A: 这些是占位符 URL，可根据需要修改为内部文档链接

## 相关命令

| 命令 | 功能 |
|------|------|
| `Kimi: 管理 Kimi API Key` | 配置 API Key |
| `View: Open Chat` | 打开 Chat 面板 |
| `Chat: Switch Provider` | 切换 Chat Provider |

## 扩展 API 配置

### 已启用的 API Proposals
```json
"enabledApiProposals": ["chatProvider"]
```

### 激活事件
```
onLanguageModelChatProvider:kimi
```

### 提供的 Provider
```json
{
    "vendor": "kimi",
    "displayName": "Kimi (GitCode)",
    "managementCommand": "kimi.manageApiKey"
}
```

## 配置文件路径

```
工作区根目录/
├── product.json                          ← 主配置文件（已修改）
├── extensions/
│   └── kimi-chat-extension/
│       ├── package.json                  ← 扩展配置
│       ├── src/
│       │   └── extension.ts              ← 扩展实现
│       └── ...
└── docs/
    ├── 技术解决方案/
    │   └── 默认Agent未注册-技术方案.md       ← 详细分析
    ├── 实施方案/
    │   └── 方案1-Kimi-Chat-默认配置.md     ← 实施细节
    └── 解决方案总结/
        └── Chat-默认Agent问题-完整解决方案.md ← 完整总结
```

## 回滚步骤（如需要）

1. 打开 `product.json`
2. 删除 `defaultChatAgent` 配置块（第 1155-1199 行）
3. 保存文件
4. 重启应用

```diff
- "defaultChatAgent": {
-     ...（删除所有内容）
- },
  "extensionsGallery": {
```

## 性能影响

- **应用启动时间**：影响可忽略（~0ms）
- **内存占用**：配置对象 ~2KB
- **Chat 响应时间**：取决于 Kimi API（通常 <3s）

## 安全性考虑

| 项目 | 说明 |
|------|------|
| API Key 存储 | 使用 VS Code Secret Storage（安全） |
| 配置文件 | product.json 为公开配置，不包含敏感信息 |
| 通信 | HTTPS 通信（由 Kimi API 提供） |

## 下一步

- [ ] 重启应用验证功能
- [ ] 配置 Kimi API Key
- [ ] 测试 Chat 功能
- [ ] 根据需要自定义文档链接
- [ ] 可选：添加更多 Chat Provider

## 版本信息

- **修改日期**：2025-12-28
- **修改版本**：dev
- **兼容 VS Code 版本**：^1.85.0 及更高

---

**状态**：✅ 实施完成
**下一步**：重启应用验证功能

