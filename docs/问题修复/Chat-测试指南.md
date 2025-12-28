# 测试步骤和预期结果

**时间**: 2025-12-28 18:02
**当前状态**: 应用已启动 (http://127.0.0.1:8080)
**修复已应用**: Kimi 认证提供商已注册

## 下一步操作

### 1. 打开开发者工具
- 按 `F12` 或右键 → 检查 (Inspect)
- 转到 "控制台" (Console) 标签
- 查找以 "Kimi:" 或 "ERR" 开头的日志

### 2. 打开 Chat 面板
- 按 `Ctrl+Alt+I` 或点击左侧 Chat 图标
- 应该看到 Kimi 作为可用的聊天提供商

### 3. 测试发送消息
- 在 Chat 输入框中输入一个测试消息，例如 "你好"
- 按 Enter 发送
- 观察：
  - 是否显示认证错误？
  - 是否显示 "Working..." 但永不完成？
  - 是否收到 Kimi 的响应？

### 4. 检查浏览器控制台日志
查看是否有以下日志条目：

**预期的良好日志:**
```
Kimi Chat Extension activated
Kimi: registerLanguageModelChatProvider called with vendor: kimi
Kimi: provideLanguageModelChatInformation called
Kimi: Making HTTP request to https://api.gitcode.com/api/v5/chat/completions
Kimi: API response status: 200
Kimi: Received chunk, size: ...
```

**不应该看到的错误:**
```
❌ ERR Timed out waiting for authentication provider 'kimi' to register
❌ ERR No default agent registered
❌ ERR CodeExpectedError: No default agent registered
❌ Chat failed to get ready. Please ensure that the extension vscode.kimi-chat-extension is installed and enabled
```

## 问题诊断指南

### 症状 1: "Chat failed to get ready"
**可能原因:**
- Kimi 扩展未正确加载
- 语言模型提供商未正确注册

**解决步骤:**
1. 检查控制台中 "Kimi Chat Extension activated" 是否出现
2. 检查 "registerLanguageModelChatProvider" 是否被调用

### 症状 2: "No language models requiring authentication found"
**可能原因:**
- 认证提供商注册成功，但模型信息未正确返回

**解决步骤:**
1. 检查 "provideLanguageModelChatInformation called" 是否出现
2. 查找返回的模型列表是否包含 "Kimi-K2"

### 症状 3: 消息卡在 "Working..."
**可能原因:**
- API 请求超时
- API 响应格式错误
- 网络连接问题

**解决步骤:**
1. 检查 "API response status:" 日志
2. 检查是否有 "timeout" 相关错误
3. 检查 Network 标签中的 API 请求和响应

### 症状 4: "API request timeout (30s elapsed)"
**可能原因:**
- Kimi API 服务不可用
- 网络连接延迟
- API 密钥无效

**解决步骤:**
1. 手动测试 API 端点：
   ```bash
   curl -X POST https://api.gitcode.com/api/v5/chat/completions \
     -H "Authorization: Bearer 7hBwcGgKdSiGHS1zMBQm8YHN" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "Kimi-K2",
       "messages": [{"role": "user", "content": "hello"}],
       "stream": true
     }' -v
   ```

2. 检查响应状态码和内容

## 预期的工作流程

如果修复成功，应该看到：

1. **启动时**
   - ✅ "Kimi Chat Extension activated"
   - ✅ 没有认证超时错误

2. **打开 Chat 面板时**
   - ✅ Chat 面板加载成功
   - ✅ 显示 Kimi 作为可用的聊天提供商
   - ✅ 可以输入消息

3. **发送消息时**
   - ✅ 显示 "Working..." 或进度指示器
   - ✅ 在几秒钟内收到 Kimi API 的响应
   - ✅ 响应以流式方式显示在 Chat 面板中

4. **Browser DevTools 中**
   - ✅ Network 标签显示 POST 请求到 https://api.gitcode.com/api/v5/chat/completions
   - ✅ 响应状态为 200
   - ✅ 响应包含 SSE 格式的数据

## 关键文件位置

如需进一步调试，查看这些关键文件：

| 文件 | 目的 |
|------|------|
| `/workspaces/openvscode-server/extensions/kimi-chat-extension/src/extension.ts` | Kimi 扩展的核心代码（认证提供商 + 语言模型提供商） |
| `/workspaces/openvscode-server/extensions/kimi-chat-extension/out/extension.js` | 编译后的扩展代码 |
| `/workspaces/openvscode-server/product.json` | 产品配置（defaultChatAgent） |
| `/workspaces/openvscode-server/src/vs/workbench/contrib/chat/common/chatServiceImpl.ts` | ChatService 实现 |
