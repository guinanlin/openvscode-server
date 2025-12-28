# Code-Server 启动和 Chat 测试指南

**时间**: 2025-12-28 18:23
**状态**: ✅ Code-Server 启动成功
**访问地址**: http://localhost:3000

## 启动信息

```
Web UI available at http://localhost:3000
Extension host agent started.
```

服务器已经成功启动，Kimi 扩展已被加载为内置扩展。

## 现在可以做的事情

### 1. 验证 Kimi 扩展已激活

打开浏览器控制台（F12），查看是否有：
```
✅ Kimi Chat Extension activated
✅ Kimi: registerLanguageModelChatProvider called
```

**不应该看到**:
```
❌ ERR Timed out waiting for authentication provider 'kimi'
❌ ERR No default agent registered
```

### 2. 打开 Chat 面板

使用快捷键或菜单：
- **快捷键**: Ctrl+Alt+I (Windows/Linux) 或 Cmd+Shift+I (Mac)
- **菜单**: 点击左侧活动栏中的聊天图标

### 3. 发送测试消息

在 Chat 输入框中输入：
```
你好，请介绍一下自己
```

然后按 Enter 发送。

### 4. 预期结果

**成功的情况**:
- ✅ Chat 面板加载成功
- ✅ 显示输入框，可以输入消息
- ✅ 消息发送后，显示 "Working..." 或进度条
- ✅ 2-5 秒内收到 Kimi 的回复
- ✅ 回复内容流式显示在 Chat 面板中

**如果出现问题**:
- ❌ Chat 面板显示错误信息
- ❌ 消息永远卡在 "Working..."
- ❌ 浏览器控制台有红色错误

## 诊断步骤

### 如果 Chat 面板无法加载

1. **清除缓存**:
   - F12 打开开发者工具
   - 右键 → 清除网站数据 (Clear Site Data)
   - 刷新页面

2. **检查控制台日志**:
   - F12 → Console 标签
   - 查找 "Kimi" 相关的日志
   - 查找任何红色的错误信息

3. **检查 Network 标签**:
   - F12 → Network 标签
   - 查看是否有 4xx 或 5xx 的网络错误
   - 查看 API 请求的响应内容

### 如果消息卡在 "Working..."

这通常表示 API 请求没有收到响应。检查：

```bash
# 测试 API 端点是否可访问
curl -X POST https://api.gitcode.com/api/v5/chat/completions \
  -H "Authorization: Bearer 7hBwcGgKdSiGHS1zMBQm8YHN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Kimi-K2",
    "messages": [{"role": "user", "content": "hello"}],
    "stream": true
  }' \
  -v
```

预期响应：
- **状态码**: 200
- **Content-Type**: text/event-stream
- **数据格式**:
  ```
  data: {"choices":[{"delta":{"content":"..."}}]}
  ```

### 关键日志信息

在浏览器控制台中查找这些日志：

```javascript
// 扩展激活
"Kimi Chat Extension activated"
"Kimi: registerLanguageModelChatProvider called"

// 用户发送消息时
"Kimi: provideLanguageModelChatResponse called"
"Kimi: Converting messages, count: X"
"Kimi: Making HTTP request to https://api.gitcode.com/api/v5/chat/completions"

// API 响应
"Kimi: API response status: 200"
"Kimi: Received chunk, size: XXX"
"Kimi: Response stream completed"
```

## 故障排除流程图

```
Chat 能否加载？
├─ NO → 检查浏览器控制台，查找 "ERR" 日志
│         ├─ 认证超时？ → 扩展未被激活，检查 Kimi 扩展加载状态
│         ├─ No default agent？ → ChatService 未找到默认代理
│         └─ 其他错误？ → 查看详细错误信息
├─ YES ↓
能否输入消息？
├─ NO → Chat 面板有问题，检查 JS 错误
├─ YES ↓
发送消息后...
├─ 显示 "Working..." 很长时间 → API 请求超时
│ └─ 检查 Network 标签中的 POST 请求
│ └─ 测试 curl 命令验证 API
├─ 显示错误信息 → 查看具体错误
│ └─ 检查浏览器控制台中的 "ERR" 日志
└─ 显示回复 ✅ → 成功！
```

## 快速检查清单

在浏览器中测试时：

- [ ] 打开 F12 开发者工具
- [ ] 转到 Console 标签
- [ ] 查找 "Kimi Chat Extension activated"
- [ ] 打开 Chat 面板 (Ctrl+Alt+I)
- [ ] 输入测试消息
- [ ] 观察控制台和 Network 标签
- [ ] 等待收到回复（应该在 5 秒内）

## 相关命令

如果需要重新启动 code-server：

```bash
# 停止当前服务器 (Ctrl+C)

# 重新启动
cd /workspaces/openvscode-server
./scripts/code-server.sh --without-connection-token --port 3000
```

## 重要提示

⚠️ **关于扩展下载错误**

启动日志中的这个错误是无害的：
```
Error: end of central directory record signature not found
```

这是在下载某些市场扩展时发生的，不影响 Kimi 扩展的功能（它是内置扩展，已在源代码中包含）。

## 下一步

- ✅ 验证 Chat 功能是否正常
- ✅ 如果有问题，收集浏览器控制台的日志
- ✅ 如果需要，运行 curl 命令测试 API

祝测试顺利！🎉
