# Kimi Chat Extension

VS Code 扩展，用于集成 Kimi 大语言模型（通过 GitCode API）。

## 功能特性

- 在 VS Code Chat 中使用 Kimi-K2 模型
- 支持流式响应
- 安全的 API Key 存储
- 支持 Agent 模式和工具调用

## 安装

1. 编译扩展：
```bash
cd extensions/kimi-chat-extension
npm install
npm run compile
```

2. 在 VS Code 中加载扩展（开发模式）：
   - 按 `F5` 启动扩展开发宿主
   - 在新窗口中测试扩展

## 配置

### API Key 配置

扩展支持三种方式配置 API Key：

#### 方法一：通过 "Manage Models..." 界面（推荐）

1. 打开 Chat 面板（`Ctrl+L` 或通过命令面板）
2. 点击 "Pick Model" 下拉菜单
3. 选择 "Manage Models..." 选项
4. 在列表中找到 "Kimi (GitCode)"
5. 点击右侧的**齿轮图标**（设置图标）
6. 在弹出的输入框中输入你的 API Key：`7hBwcGgKdSiGHS1zMBQm8YHN`
7. 点击确认

#### 方法二：通过命令面板

1. 按 `F1` 或 `Ctrl+Shift+P`（Mac: `Cmd+Shift+P`）打开命令面板
2. 输入 "Kimi" 或 "管理 Kimi API Key"
3. 选择 "管理 Kimi API Key" 命令
4. 在弹出的输入框中输入你的 API Key：`7hBwcGgKdSiGHS1zMBQm8YHN`
5. 点击确认

#### 方法三：通过设置界面

1. 打开设置（`Ctrl+,` 或 `Cmd+,`）
2. 搜索 "kimi.apiKey"
3. 在 "Kimi: Api Key" 字段中输入你的 API Key：`7hBwcGgKdSiGHS1zMBQm8YHN`

**注意**：API Key 会安全地存储在 VS Code 的 SecretStorage 中，不会以明文形式保存。

## 使用方法

### 快速开始

1. **配置 API Key**（如果还没有配置）：
   - 按照上面的 "API Key 配置" 步骤配置你的 API Key

2. **选择模型**：
   - 打开 Chat 面板（`Ctrl+L` 或通过命令面板）
   - 点击 "Pick Model" 下拉菜单
   - 选择 "Kimi-K2" 模型

3. **开始对话**：
   - 在聊天输入框中输入你的问题
   - 按 `Enter` 发送消息
   - 模型会以流式方式返回响应

### 模型已自动启用

由于我们修改了服务端初始化逻辑，Kimi 模型会在服务端启动时自动解析和启用，无需手动通过 "Manage Models..." 启用。如果模型没有出现在下拉菜单中，请：

1. 刷新页面或重启服务端
2. 检查扩展是否正确编译和加载
3. 查看浏览器控制台是否有错误信息

## API 配置

- **Base URL**: `https://api.gitcode.com/api/v5`
- **模型 ID**: `Kimi-K2`
- **API 格式**: OpenAI 兼容（SSE 流式响应）

## 开发

### 项目结构

```
kimi-chat-extension/
├── package.json          # 扩展配置
├── tsconfig.json         # TypeScript 配置
├── src/
│   └── extension.ts     # 扩展主文件
└── README.md            # 说明文档
```

### 编译

```bash
npm run compile
```

### 调试

1. 在 VS Code 中打开扩展目录
2. 按 `F5` 启动调试
3. 在新窗口中测试扩展功能

## 注意事项

⚠️ **安全提示**：
- 不要将 API Key 提交到版本控制系统
- 使用 VS Code 的 SecretStorage 存储敏感信息
- 生产环境应该从环境变量或配置中读取

## 许可证

MIT

