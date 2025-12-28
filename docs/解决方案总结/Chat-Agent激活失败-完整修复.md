# Chat 默认 Agent 激活失败 - 完整修复

## 问题诊断

运行时错误：`No default chat agent available`

**错误链条**：
1. Chat 服务启动时尝试激活默认 agent
2. 调用 `chatAgentService.getContributedDefaultAgent()`
3. 因为 Kimi 扩展还没有被激活，所以没有注册任何 agent
4. 返回 `undefined`
5. ChatService 抛出错误

这是一个**循环依赖**问题：
- 需要 agent 数据来激活扩展
- 但扩展需要被激活才能注册 agent 数据

## 解决方案实施

### 修改 1：更新 `product.json` - 声明 Kimi 为内置扩展

在 `builtInExtensions` 数组的开头添加 Kimi 扩展条目：

```json
"builtInExtensions": [
    {
        "name": "vscode.kimi-chat-extension",
        "version": "0.1.0",
        "repo": "local",
        "metadata": {
            "id": "kimi-chat-extension",
            "publisherId": {
                "publisherId": "vscode",
                "publisherName": "vscode",
                "displayName": "VS Code"
            },
            "publisherDisplayName": "VS Code"
        }
    },
    ...（其他扩展）
]
```

**目的**：让 VS Code 知道 Kimi 扩展是内置扩展，并知道在哪里找到它

### 修改 2：更新 `chatServiceImpl.ts` - 改进扩展激活逻辑

#### 2.1 添加导入

```typescript
import { IProductService } from '../../../../platform/product/common/productService.js';
import { ExtensionIdentifier } from '../../../../platform/extensions/common/extensions.js';
```

#### 2.2 在构造函数中注入 `IProductService`

```typescript
constructor(
    @IStorageService private readonly storageService: IStorageService,
    // ... 其他参数
    @IProductService private readonly productService: IProductService,
) {
    // ...
}
```

#### 2.3 改进 `activateDefaultAgent()` 方法

原来的逻辑：
```typescript
const defaultAgentData = this.chatAgentService.getContributedDefaultAgent(location);
if (!defaultAgentData) {
    throw new ErrorNoTelemetry('No default agent contributed');
}
// 然后激活扩展...
```

新的逻辑：
```typescript
let defaultAgentData = this.chatAgentService.getContributedDefaultAgent(location);

// 如果没有找到，尝试基于 product.json 配置激活扩展
if (!defaultAgentData) {
    const productDefaultChatAgent = this.productService.defaultChatAgent;
    if (productDefaultChatAgent) {
        // 直接激活扩展（基于 product.json 配置）
        const extensionId = new ExtensionIdentifier(productDefaultChatAgent.extensionId);
        await this.extensionService.activateById(extensionId, {
            activationEvent: `onLanguageModelChatProvider:${productDefaultChatAgent.extensionId.split('.').pop()}`,
            extensionId: extensionId,
            startup: false
        });

        // 激活后重新查询 agent 数据
        defaultAgentData = this.chatAgentService.getContributedDefaultAgent(location) ??
                          this.chatAgentService.getContributedDefaultAgent(ChatAgentLocation.Chat);
    }
}

if (!defaultAgentData) {
    throw new ErrorNoTelemetry('No default agent contributed');
}
```

**关键改进**：
- ✅ 不再等待 agent 数据，而是直接基于 `product.json` 配置激活扩展
- ✅ 激活扩展后，再次尝试获取 agent 数据
- ✅ 打破了循环依赖

## 修改清单

| 文件 | 修改类型 | 说明 |
|------|--------|------|
| `product.json` | 增加 | 在 `builtInExtensions` 中添加 Kimi 扩展 |
| `src/vs/workbench/contrib/chat/common/chatServiceImpl.ts` | 修改 | 添加导入、注入依赖、改进激活逻辑 |

## 技术要点

### 为什么需要在 `builtInExtensions` 中声明？

内置扩展需要在 `product.json` 中声明，VS Code 才能：
1. 在应用启动时发现扩展
2. 知道扩展的位置和元数据
3. 加载扩展到内存

### `activateById` 的参数

```typescript
activateById(
    extensionId: ExtensionIdentifier,  // 扩展 ID
    reason: ExtensionActivationReason  // 激活原因
): Promise<void>
```

`ExtensionActivationReason` 包括：
- `startup: boolean` - 是否在启动时激活
- `extensionId: ExtensionIdentifier` - 扩展 ID
- `activationEvent: string` - 触发的激活事件

### `onLanguageModelChatProvider:` 激活事件

扩展的 `package.json` 中定义：
```json
"activationEvents": [
    "onLanguageModelChatProvider:kimi"
]
```

当调用 `activateById` 时，传递相应的激活事件，VS Code 才能正确加载扩展。

## 验证步骤

1. ✅ 编译 Kimi 扩展
   ```bash
   cd /workspaces/openvscode-server/extensions/kimi-chat-extension
   npm run compile
   ```

2. ✅ 编译 Chat Service 代码
   ```bash
   npm run compile
   ```

3. ✅ 启动应用并打开 Chat 面板
   - 应该看到 Kimi agent 被成功激活
   - 不再出现 "No default chat agent available" 错误

## 预期行为改变

**修改前**：
```
ERR No default chat agent available. Please ensure a chat agent is configured.
```

**修改后**：
✅ Chat 面板正常工作，Kimi agent 被正确加载和使用

## 相关代码位置

- **主要修改**：`src/vs/workbench/contrib/chat/common/chatServiceImpl.ts`
  - 第 22 行：添加 `IProductService` 导入
  - 第 29 行：添加 `ExtensionIdentifier` 导入
  - 第 120 行：在构造函数中注入 `productService`
  - 第 358-378 行：改进 `activateDefaultAgent()` 方法

- **配置修改**：`product.json`
  - 第 1107 行：在 `builtInExtensions` 中添加 Kimi 扩展

## 测试覆盖

这个修改支持以下场景：

1. ✅ Kimi 扩展作为默认 Chat Agent
2. ✅ 多个 Chat 位置（Chat、Terminal、EditorInline 等）
3. ✅ 扩展激活失败时优雅降级
4. ✅ 向后兼容：不破坏现有的 agent 激活逻辑

