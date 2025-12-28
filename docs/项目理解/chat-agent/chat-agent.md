# Chat Agent 功能逻辑文档

## 概述

Chat Agent 是 VS Code 中一个强大的 AI 辅助功能，允许用户通过自然语言描述任务，Agent 会自动使用多个请求来选择文件进行编辑、运行终端命令，并在遇到错误时进行迭代。

## 核心概念

### ChatModeKind

Chat Agent 是三种聊天模式之一，定义在 `src/vs/workbench/contrib/chat/common/constants.ts`：

```typescript
export enum ChatModeKind {
    Ask = 'ask',      // 询问模式：探索和理解代码
    Edit = 'edit',    // 编辑模式：编辑或重构选中的代码
    Agent = 'agent'   // Agent 模式：描述要构建的内容
}
```

### "Build with Agent" 欢迎视图

当用户打开 Chat 面板并选择 Agent 模式时，会显示 "Build with Agent" 欢迎界面。这个逻辑位于：

**文件位置**：`src/vs/workbench/contrib/chat/browser/chatWidget.ts`

**关键方法**：`getWelcomeViewContent()` (第 1373-1435 行)

```1424:1434:openvscode-server/src/vs/workbench/contrib/chat/browser/chatWidget.ts
		} else {
			const agentHelpMessage = localize('agentMessage', "Ask to edit your files using [Agent]({0}). Agent will automatically use multiple requests to pick files to edit, run terminal commands, and iterate on errors.", 'https://aka.ms/vscode-copilot-agent');
			const message = expEmptyState ? disclaimerMessage : `${agentHelpMessage}\n\n${disclaimerMessage}`;

			return {
				title: localize('agentTitle', "Build with Agent"),
				message: new MarkdownString(message),
				icon,
				additionalMessage,
				suggestedPrompts
			};
		}
```

欢迎视图会根据当前模式显示不同的内容：
- **Ask 模式**：显示 "Ask about your code"
- **Edit 模式**：显示 "Edit in context"
- **Agent 模式**：显示 "Build with Agent"

## 架构组件

### 1. ChatWidget

**位置**：`src/vs/workbench/contrib/chat/browser/chatWidget.ts`

ChatWidget 是 Chat 功能的主要 UI 组件，负责：
- 显示聊天界面和欢迎视图
- 处理用户输入
- 管理聊天会话状态
- 渲染聊天消息和响应

### 2. ChatService

**位置**：`src/vs/workbench/contrib/chat/common/chatServiceImpl.ts`

ChatService 是聊天功能的核心服务，负责：
- 发送和处理聊天请求
- 管理聊天会话模型
- 解析用户请求（包括 agent 选择、slash 命令等）
- 协调 agent 执行

**关键方法**：`sendRequest()` (第 611-657 行)

```typescript
async sendRequest(sessionId: string, request: string, options?: IChatSendRequestOptions): Promise<IChatSendRequestData | undefined>
```

### 3. ChatAgentService

**位置**：`src/vs/workbench/contrib/chat/common/chatAgents.ts`

ChatAgentService 管理所有注册的 agent，负责：
- 注册和管理 agent
- 获取默认 agent
- 调用 agent 执行请求
- 管理 agent 的工具集

**关键方法**：`invokeAgent()` (第 495-502 行)

```typescript
async invokeAgent(id: string, request: IChatAgentRequest, progress: (parts: IChatProgress[]) => void, history: IChatAgentHistoryEntry[], token: CancellationToken): Promise<IChatAgentResult>
```

### 4. ChatModeService

**位置**：`src/vs/workbench/contrib/chat/common/chatModes.ts`

ChatModeService 管理聊天模式，包括内置模式和自定义模式。

**内置 Agent 模式定义** (第 456 行)：

```456:456:openvscode-server/src/vs/workbench/contrib/chat/common/chatModes.ts
	export const Agent = new BuiltinChatMode(ChatModeKind.Agent, 'Agent', localize('agentDescription', "Describe what to build next"));
```

## 工作流程

### 1. 用户输入请求

用户在 Chat 输入框中输入请求，ChatInputPart 组件处理输入：

**位置**：`src/vs/workbench/contrib/chat/browser/chatInputPart.ts`

**模式切换** (第 742-751 行)：

```742:751:openvscode-server/src/vs/workbench/contrib/chat/browser/chatInputPart.ts
	setChatMode(mode: ChatModeKind | string, storeSelection = true): void {
		if (!this.options.supportsChangingModes) {
			return;
		}

		const mode2 = this.chatModeService.findModeById(mode) ??
			this.chatModeService.findModeById(ChatModeKind.Agent) ??
			ChatMode.Ask;
		this.setChatMode2(mode2, storeSelection);
	}
```

### 2. 请求解析

ChatService 解析用户请求，识别：
- Agent 选择（通过 `@agentName` 语法）
- Slash 命令
- 工具引用
- 变量引用

### 3. Agent 执行

Agent 接收请求后，可以：
- 调用语言模型生成响应
- 使用工具执行操作（文件编辑、终端命令等）
- 迭代处理错误

### 4. 工具执行

Agent 模式支持多种工具：

#### 终端工具 (RunInTerminalTool)

**位置**：`src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/tools/runInTerminalTool.ts`

功能：
- 在持久化的终端会话中执行命令
- 支持前台和后台执行
- 自动截断过长输出（>60KB）
- 支持命令自动批准机制

**关键配置**：`src/vs/workbench/contrib/terminalContrib/chatAgentTools/common/terminalChatAgentToolsConfiguration.ts`

- `chat.agent.terminal.autoApprove` - 自动批准规则
- `chat.agent.terminal.enableAutoApprove` - 启用自动批准
- `chat.agent.terminal.profile.*` - 终端配置文件

#### 文件编辑工具 (EditTool)

**位置**：`src/vs/workbench/contrib/chat/common/tools/editFileTool.ts`

功能：
- 编辑文件内容
- 支持多文件编辑
- 提供编辑预览和确认机制

#### 任务工具 (RunTaskTool)

**位置**：`src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/tools/task/createAndRunTaskTool.ts`

功能：
- 创建和运行 VS Code 任务
- 支持任务配置

### 5. 响应渲染

ChatWidget 渲染 agent 的响应，包括：
- 文本响应
- 代码块
- 工具调用结果
- 进度更新

## 工具注册

工具通过 `ILanguageModelToolsService` 注册：

**位置**：`src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/terminal.chatAgentTools.contribution.ts`

```typescript
// 注册终端工具
const runInTerminalTool = instantiationService.createInstance(RunInTerminalTool);
this._register(toolsService.registerTool(runInTerminalToolData, runInTerminalTool));
```

## 配置项

### Chat 配置

定义在 `src/vs/workbench/contrib/chat/common/constants.ts`：

- `chat.agent.enabled` - 启用 Agent 模式
- `chat.agent.thinkingStyle` - 思考样式显示模式
- `chat.agentSessionsViewLocation` - Agent 会话视图位置

### 终端工具配置

- `chat.agent.terminal.autoApprove` - 命令自动批准规则
- `chat.agent.terminal.enableAutoApprove` - 启用自动批准
- `chat.agent.terminal.profile.linux/macos/windows` - 各平台的终端配置

## 安全机制

### 命令自动批准

Agent 模式包含命令自动批准机制，防止执行危险命令：

1. **默认安全规则**：内置一组安全的只读命令（如 `ls`, `cat`, `pwd` 等）
2. **用户配置**：用户可以配置自定义的批准规则
3. **提示注入警告**：对可能包含提示注入的命令进行警告

**位置**：`src/vs/workbench/contrib/terminalContrib/chatAgentTools/common/terminalChatAgentToolsConfiguration.ts`

## 扩展点

### 注册自定义 Agent

通过 Extension API 可以注册自定义 agent：

**位置**：`src/vs/workbench/api/common/extHostChatAgents2.ts`

```typescript
// Extension 端
const agent = vscode.chat.createAgent('myAgent', {
    name: 'My Agent',
    description: 'My custom agent',
    // ...
});
```

### 注册自定义工具

通过 `ILanguageModelToolsService` 可以注册自定义工具：

```typescript
const tool = instantiationService.createInstance(MyCustomTool);
toolsService.registerTool(toolData, tool);
```

## 关键文件清单

### 核心文件

- `src/vs/workbench/contrib/chat/browser/chatWidget.ts` - Chat UI 组件
- `src/vs/workbench/contrib/chat/common/chatServiceImpl.ts` - Chat 服务实现
- `src/vs/workbench/contrib/chat/common/chatAgents.ts` - Agent 服务
- `src/vs/workbench/contrib/chat/common/chatModes.ts` - 聊天模式定义
- `src/vs/workbench/contrib/chat/common/constants.ts` - 常量和枚举定义
- `src/vs/workbench/contrib/chat/browser/chatInputPart.ts` - 输入组件

### 工具实现

- `src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/tools/runInTerminalTool.ts` - 终端工具
- `src/vs/workbench/contrib/chat/common/tools/editFileTool.ts` - 文件编辑工具
- `src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/tools/task/createAndRunTaskTool.ts` - 任务工具

### 配置

- `src/vs/workbench/contrib/terminalContrib/chatAgentTools/common/terminalChatAgentToolsConfiguration.ts` - 终端工具配置

## 使用示例

### 切换到 Agent 模式

```typescript
// 通过命令
vscode.commands.executeCommand('workbench.action.chat.open', { 
    mode: 'agent' 
});

// 或通过 ChatInputPart
chatInputPart.setChatMode(ChatModeKind.Agent);
```

### 发送 Agent 请求

```typescript
chatService.sendRequest(sessionId, "创建一个新的 TypeScript 项目", {
    modeInfo: { kind: ChatModeKind.Agent },
    location: ChatAgentLocation.Chat
});
```

## Pick Model 配置

### 概述

"Pick Model" 是 Chat 输入框中的一个下拉菜单，允许用户选择要使用的语言模型。这个功能位于 Chat 输入框的底部工具栏中。

### 实现位置

**核心组件**：
- **UI 组件**：`src/vs/workbench/contrib/chat/browser/modelPicker/modelPickerActionItem.ts`
- **管理功能**：`src/vs/workbench/contrib/chat/browser/actions/manageModelsActions.ts`
- **服务**：`src/vs/workbench/contrib/chat/common/languageModels.ts`

### 模型显示逻辑

模型是否显示在 "Pick Model" 下拉菜单中，由以下因素决定：

1. **`isUserSelectable` 属性**：模型元数据中的 `isUserSelectable` 必须为 `true`
2. **用户偏好设置**：用户可以通过 "Manage Models..." 功能控制哪些模型显示
3. **模型支持检查**：对于 Agent 模式，模型必须支持 Agent 模式（`capabilities.agentMode === true`）

**代码位置**：`src/vs/workbench/contrib/chat/browser/chatInputPart.ts` (第 777-788 行)

```777:788:openvscode-server/src/vs/workbench/contrib/chat/browser/chatInputPart.ts
	private getModels(): ILanguageModelChatMetadataAndIdentifier[] {
		const cachedModels = this.storageService.getObject<ILanguageModelChatMetadataAndIdentifier[]>('chat.cachedLanguageModels', StorageScope.APPLICATION, []);
		let models = this.languageModelsService.getLanguageModelIds()
			.map(modelId => ({ identifier: modelId, metadata: this.languageModelsService.lookupLanguageModel(modelId)! }));
		if (models.length === 0 || models.some(m => m.metadata.isDefault) === false) {
			models = cachedModels;
		} else {
			this.storageService.store('chat.cachedLanguageModels', models, StorageScope.APPLICATION, StorageTarget.MACHINE);
		}
		models.sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));
		return models.filter(entry => entry.metadata?.isUserSelectable && this.modelSupportedForDefaultAgent(entry));
	}
```

### 配置方式

#### 方式一：通过 UI 管理（推荐）

1. **打开模型管理器**：
   - 点击 "Pick Model" 下拉菜单
   - 选择 "Manage Models..." 选项
   - 或使用命令：`workbench.action.chat.manageLanguageModels`

2. **选择模型**：
   - 首先选择模型提供商（Vendor）
   - 然后勾选要显示在 "Pick Model" 中的模型
   - 取消勾选以隐藏模型

**实现位置**：
- **Action 定义**：`src/vs/workbench/contrib/chat/browser/actions/manageModelsActions.ts`
  - `ManageModelsAction` 类（第 30-142 行）
  - 命令 ID：`workbench.action.chat.manageLanguageModels`
- **Action 注册**：`src/vs/workbench/contrib/chat/browser/actions/chatLanguageModelActions.ts`
  - `registerLanguageModelActions()` 函数（第 231-234 行）
- **UI 集成**：`src/vs/workbench/contrib/chat/browser/modelPicker/modelPickerActionItem.ts`
  - `getModelPickerActionBarActionProvider()` 函数（第 72-115 行）
  - "Manage Models..." 选项通过 `actionBarActionProvider` 动态添加到 "Pick Model" 下拉菜单中
  - 显示条件：仅对 Free/Pro/ProPlus/Internal 用户显示（第 77-82 行）

#### 方式二：通过扩展注册

语言模型通过扩展（Extension）进行配置和注册，分为两个步骤：

**步骤 1：在 `package.json` 中声明提供商**

扩展需要在 `package.json` 的 `contributes` 部分声明语言模型提供商：

```json
{
  "contributes": {
    "languageModelChatProviders": [
      {
        "vendor": "my-vendor",           // 唯一的提供商标识符
        "displayName": "My AI Provider",  // 显示名称
        "managementCommand": "myExtension.manageModels",  // 可选：管理命令
        "when": "someCondition"          // 可选：显示条件
      }
    ]
  }
}
```

**扩展点定义位置**：`src/vs/workbench/contrib/chat/common/languageModels.ts` (第 293-310 行)

```293:310:openvscode-server/src/vs/workbench/contrib/chat/common/languageModels.ts
export const languageModelChatProviderExtensionPoint = ExtensionsRegistry.registerExtensionPoint<IUserFriendlyLanguageModel | IUserFriendlyLanguageModel[]>({
	extensionPoint: 'languageModelChatProviders',
	jsonSchema: {
		description: localize('vscode.extension.contributes.languageModelChatProviders', "Contribute language model chat providers of a specific vendor."),
		oneOf: [
			languageModelChatProviderType,
			{
				type: 'array',
				items: languageModelChatProviderType
			}
		]
	},
	activationEventsGenerator: function* (contribs: readonly IUserFriendlyLanguageModel[]) {
		for (const contrib of contribs) {
			yield `onLanguageModelChatProvider:${contrib.vendor}`;
		}
	}
});
```

**步骤 2：在代码中注册提供商并返回模型列表**

扩展激活后，通过 VS Code API 注册提供商：

```typescript
// Extension 端注册模型提供商
const provider = vscode.lm.registerLanguageModelChatProvider('my-vendor', {
    // 提供模型信息
    async provideLanguageModelChatInformation(options, token) {
        return [
            {
                id: 'my-model-1',
                name: 'My Model 1',
                version: '1.0.0',
                family: 'my-family',
                maxInputTokens: 8192,
                maxOutputTokens: 4096,
                isUserSelectable: true,  // 控制是否在 "Pick Model" 中显示
                isDefault: false,        // 是否为默认模型
                category: {              // 可选：模型分类
                    label: 'My Models',
                    order: 1
                },
                capabilities: {
                    toolCalling: true,   // 支持工具调用
                    agentMode: true,     // 支持 Agent 模式
                    imageInput: false    // 是否支持图像输入
                }
            }
        ];
    },
    
    // 处理聊天请求
    async provideLanguageModelChatResponse(model, messages, options, progress, token) {
        // 实现模型响应逻辑
    },
    
    // 计算 token 数量
    async provideTokenCount(model, text, token) {
        // 实现 token 计数逻辑
    }
});
```

**注册实现位置**：
- **Extension Host 端**：`src/vs/workbench/api/common/extHostLanguageModels.ts` (第 142-160 行)
- **Main Thread 端**：`src/vs/workbench/api/browser/mainThreadLanguageModels.ts` (第 57-105 行)

**示例**：参考 `extensions/vscode-api-tests/package.json` 和 `extensions/vscode-api-tests/src/singlefolder-tests/lm.test.ts`

#### 方式三：通过存储偏好设置

系统会将用户的模型选择偏好存储在：

- **存储键**：`chatModelPickerPreferences`
- **存储范围**：`StorageScope.PROFILE`
- **格式**：`Record<string, boolean>` - 键为模型 ID，值为是否显示

**代码位置**：`src/vs/workbench/contrib/chat/common/languageModels.ts` (第 398-410 行)

```typescript
updateModelPickerPreference(modelIdentifier: string, showInModelPicker: boolean): void {
    // 更新用户偏好
    this._modelPickerUserPreferences[modelIdentifier] = showInModelPicker;
    // 保存到存储
    this._storageService.store('chatModelPickerPreferences', 
        this._modelPickerUserPreferences, 
        StorageScope.PROFILE, 
        StorageTarget.USER);
}
```

### 模型分类

模型可以在下拉菜单中按类别分组显示，通过 `modelPickerCategory` 属性设置：

```typescript
interface ILanguageModelChatMetadata {
    modelPickerCategory?: { 
        label: string;  // 类别标签
        order: number;  // 排序顺序
    };
}
```

**默认类别**：`DEFAULT_MODEL_PICKER_CATEGORY` - "Other Models"

**位置**：`src/vs/workbench/contrib/chat/common/modelPicker/modelPickerWidget.ts`

### 快捷键

打开模型选择器的快捷键：
- **快捷键**：`Ctrl+Alt+.` (Windows/Linux) 或 `Cmd+Alt+.` (Mac)
- **命令 ID**：`workbench.action.chat.openModelPicker`
- **条件**：仅在 Chat 输入框中时可用

**位置**：`src/vs/workbench/contrib/chat/browser/actions/chatExecuteActions.ts` (第 387-427 行)

### 相关配置项

虽然没有直接的配置项控制 "Pick Model" 的行为，但以下因素会影响模型显示：

1. **模型元数据**：
   - `isUserSelectable` - 是否可被用户选择
   - `modelPickerCategory` - 模型分类
   - `capabilities.agentMode` - 是否支持 Agent 模式

2. **存储偏好**：
   - `chatModelPickerPreferences` - 用户选择的模型偏好
   - `chat.cachedLanguageModels` - 缓存的模型列表

### 常见问题

**Q: 为什么某个模型没有出现在 "Pick Model" 中？**

A: 可能的原因：
1. 模型的 `isUserSelectable` 属性为 `false`
2. 用户在 "Manage Models" 中取消选择了该模型
3. 对于 Agent 模式，模型不支持 `agentMode` 能力

**Q: 如何重置模型选择偏好？**

A: 可以通过以下方式：
1. 在 "Manage Models" 中重新选择模型
2. 清除存储中的 `chatModelPickerPreferences` 键
3. 对于 Business/Enterprise 用户，系统会在权限变更时自动清除偏好

## 总结

Chat Agent 是一个强大的自动化工具，通过以下方式工作：

1. **用户描述任务** → 在 Agent 模式下输入自然语言描述
2. **Agent 解析意图** → 理解用户想要完成的任务
3. **工具调用** → 自动选择合适的工具（文件编辑、终端命令等）
4. **迭代执行** → 根据结果和错误进行迭代
5. **结果展示** → 在 Chat 界面中展示执行结果

整个系统设计为可扩展的，支持自定义 agent 和工具，为开发者提供了强大的 AI 辅助开发能力。

### Pick Model 功能总结

"Pick Model" 下拉菜单允许用户：
- 选择不同的语言模型进行对话
- 管理哪些模型显示在列表中
- 通过分类组织模型
- 快速切换模型而无需重新配置

模型的选择和显示由扩展注册时的元数据、用户偏好设置和系统过滤逻辑共同决定。

