# Kimi Chat Agent 激活失败 - 快速修复指南

## 问题

运行时 Chat 面板出现错误：
```
ERR No default chat agent available. Please ensure a chat agent is configured.
```

## 根本原因

**循环依赖**：
- ChatService 需要 agent 数据来激活扩展
- 但 Kimi 扩展必须激活才能注册 agent 数据

## 解决方案（已应用）

### 1️⃣ 修改 `product.json`

在 `builtInExtensions` 数组开头添加：

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
    ...
]
```

**目的**：注册 Kimi 为内置扩展

### 2️⃣ 修改 `src/vs/workbench/contrib/chat/common/chatServiceImpl.ts`

**A. 添加导入**（第 22、29 行）：
```typescript
import { IProductService } from '../../../../platform/product/common/productService.js';
import { ExtensionIdentifier } from '../../../../platform/extensions/common/extensions.js';
```

**B. 注入依赖**（第 120 行）：
```typescript
@IProductService private readonly productService: IProductService,
```

**C. 改进 `activateDefaultAgent()` 方法**（第 358-378 行）：

改变策略：
- ❌ **旧**：等待 agent 数据 → 激活扩展
- ✅ **新**：基于 product.json 直接激活扩展 → 获取 agent 数据

```typescript
async activateDefaultAgent(location: ChatAgentLocation): Promise<void> {
    await this.extensionService.whenInstalledExtensionsRegistered();

    let defaultAgentData = this.chatAgentService.getContributedDefaultAgent(location) ??
                          this.chatAgentService.getContributedDefaultAgent(ChatAgentLocation.Chat);

    // 新增：如果没有 agent 数据，尝试激活配置的扩展
    if (!defaultAgentData) {
        const productDefaultChatAgent = this.productService.defaultChatAgent;
        if (productDefaultChatAgent) {
            const extensionId = new ExtensionIdentifier(productDefaultChatAgent.extensionId);
            await this.extensionService.activateById(extensionId, {
                activationEvent: `onLanguageModelChatProvider:${productDefaultChatAgent.extensionId.split('.').pop()}`,
                extensionId: extensionId,
                startup: false
            });

            // 激活后重新查询
            defaultAgentData = this.chatAgentService.getContributedDefaultAgent(location) ??
                              this.chatAgentService.getContributedDefaultAgent(ChatAgentLocation.Chat);
        }
    }

    if (!defaultAgentData) {
        throw new ErrorNoTelemetry('No default agent contributed');
    }

    // ... 继续原有逻辑
}
```

## 验证

### 编译
```bash
cd /workspaces/openvscode-server/extensions/kimi-chat-extension
npm run compile

npm run compile
```

### 测试
1. 启动应用
2. 打开 Chat 面板
3. 输入消息，应该看到 ✅ 成功

## 关键改变

| 方面 | 之前 | 之后 |
|------|------|------|
| 扩展激活 | 被动（等待 agent 数据） | 主动（基于 product.json） |
| 循环依赖 | ❌ 存在 | ✅ 已解决 |
| 失败时 | 立即抛出错误 | 尝试激活扩展，再失败 |

## 文件修改

- ✅ `/workspaces/openvscode-server/product.json`
- ✅ `/workspaces/openvscode-server/src/vs/workbench/contrib/chat/common/chatServiceImpl.ts`

