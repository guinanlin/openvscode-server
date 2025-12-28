# 安装中文语言包后的配置步骤

## ✅ 语言包已安装成功

你已经成功安装了中文语言包：
```
Extension 'ms-ceintl.vscode-language-pack-zh-hans' v1.106.0 was successfully installed.
```

## ⚠️ 重要提示

命令行参数 `--locale` 在服务器模式下**不支持**（这是正常的）：
```
Ignoring option 'locale': not supported for server.
```

语言设置必须通过 **Web 界面**来配置。

---

## 📋 下一步操作

### 步骤 1：启动服务器（如果还没启动）

```bash
cd ~/project/openvscode-server
./scripts/code-server.sh --without-connection-token --port 3000
```

### 步骤 2：在 Web 界面中配置语言

1. **打开浏览器**，访问：`http://your-server-ip:3000`

2. **打开命令面板**：
   - 按 `Ctrl+Shift+P`（Windows/Linux）
   - 或按 `Cmd+Shift+P`（macOS）

3. **选择语言配置**：
   - 输入：`Configure Display Language`
   - 选择：**"Configure Display Language"** 命令

4. **选择中文**：
   - 在弹出的语言列表中选择：**"中文(简体)"** 或 **"zh-cn"**

5. **重启服务器**：
   - 系统会弹出提示："The display language has been changed, please restart VS Code for the change to take effect."
   - 点击 **"Restart"** 按钮重启服务器

### 步骤 3：验证

重启后，界面应该会变成中文。检查以下内容：
- ✅ 菜单栏显示中文
- ✅ 命令面板中的命令显示中文
- ✅ 设置界面显示中文
- ✅ 提示信息显示中文

---

## 🔧 如果重启后仍然是英文

### 方法 1：检查用户设置

1. 按 `Ctrl+Shift+P` → 输入 `Preferences: Open User Settings (JSON)`
2. 检查是否有 `"locale": "zh-cn"` 配置
3. 如果没有，手动添加：
   ```json
   {
     "locale": "zh-cn"
   }
   ```
4. 保存并重启服务器

### 方法 2：检查扩展是否启用

1. 按 `Ctrl+Shift+X` 打开扩展视图
2. 搜索：`Chinese (Simplified) Language Pack`
3. 确认扩展已**启用**（不是禁用状态）

### 方法 3：手动设置配置文件

如果上述方法都不行，可以手动编辑配置文件：

```bash
# 找到用户数据目录（通常在 ~/.openvscode-server/User/）
# 编辑 settings.json
nano ~/.openvscode-server/User/settings.json
```

添加或修改：
```json
{
  "locale": "zh-cn"
}
```

然后重启服务器。

---

## 📝 命令行安装语言包的完整命令（参考）

```bash
# 安装语言包（不需要 --locale 参数）
./scripts/code-server.sh --install-extension ms-ceintl.vscode-language-pack-zh-hans

# 然后启动服务器
./scripts/code-server.sh --without-connection-token --port 3000

# 在 Web 界面中配置语言并重启
```

---

## 🎯 快速检查清单

- [ ] 语言包已安装（✓ 已完成）
- [ ] 服务器已启动
- [ ] 在 Web 界面中执行了 `Configure Display Language`
- [ ] 选择了 `中文(简体)`
- [ ] 点击了 `Restart` 重启服务器
- [ ] 重启后界面显示中文

---

## 💡 提示

- **必须重启服务器**：语言设置只有在重启后才会生效
- **刷新浏览器不够**：必须重启服务器进程
- **命令行不支持 `--locale`**：这是设计如此，必须通过 Web 界面配置

如果还有问题，请检查服务器日志或联系支持。

