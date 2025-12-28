# OpenVSCode Server 中文语言包安装指南

## 问题描述

在 OpenVSCode Server 中通过 `Ctrl+Shift+P` → "Configure Display Language" 选择中文后，界面没有变成中文。

## 原因分析

OpenVSCode Server 默认使用 **OpenVSX**（open-vsx.org）作为扩展市场，而 Microsoft 的官方语言包（`ms-ceintl`）主要发布在 **Microsoft Marketplace** 上。因此需要手动安装中文语言包扩展。

## 解决方案

### 方案一：从扩展市场手动安装（推荐）

#### 步骤 1：打开扩展视图

1. 点击左侧边栏的扩展图标（或按 `Ctrl+Shift+X`）
2. 在搜索框中输入：`Chinese (Simplified) Language Pack` 或 `@id:MS-CEINTL.vscode-language-pack-zh-hans`

#### 步骤 2：安装语言包

1. 找到 **"Chinese (Simplified) (简体中文) Language Pack for Visual Studio Code"**
2. 点击 **"Install"** 按钮
3. 如果找不到，尝试搜索：`language-pack-zh-hans` 或 `vscode-language-pack-zh-hans`

#### 步骤 3：配置语言

1. 按 `Ctrl+Shift+P` 打开命令面板
2. 输入并选择：`Configure Display Language`
3. 选择 `中文(简体)` 或 `zh-cn`
4. **重要**：系统会提示重启，点击 **"Restart"** 按钮重启服务器

#### 步骤 4：重启服务器

重启后，界面应该会变成中文。

---

### 方案二：使用命令行安装（如果扩展市场找不到）

如果扩展市场中没有找到语言包，可以尝试手动下载并安装：

#### 方法 A：使用 VSIX 文件安装

1. **下载中文语言包 VSIX 文件**：
   - 访问：https://marketplace.visualstudio.com/items?itemName=MS-CEINTL.vscode-language-pack-zh-hans
   - 点击 "Download Extension" 下载 `.vsix` 文件

2. **在 OpenVSCode Server 中安装**：
   - 按 `Ctrl+Shift+P`
   - 输入：`Extensions: Install from VSIX...`
   - 选择下载的 `.vsix` 文件

3. **配置语言并重启**：
   - 按 `Ctrl+Shift+P` → `Configure Display Language` → 选择 `中文(简体)`
   - 重启服务器

#### 方法 B：使用命令行工具安装（服务器端，推荐）

如果你有服务器访问权限，可以在服务器上使用命令行安装：

```bash
# 方法 1：如果 OpenVSCode Server 正在运行，使用 CLI 命令
# 在终端中执行（需要先找到 openvscode-server 可执行文件路径）
./bin/openvscode-server --install-extension MS-CEINTL.vscode-language-pack-zh-hans

# 方法 2：如果是从源码运行的开发环境
# 进入项目目录
cd /home/devbox/project/openvscode-server

# 使用编译后的二进制文件安装
./out/server-cli.js --install-extension MS-CEINTL.vscode-language-pack-zh-hans

# 或者如果已经打包
../vscode-reh-web-linux-x64/bin/openvscode-server --install-extension MS-CEINTL.vscode-language-pack-zh-hans
```

**注意**：
- 如果扩展市场（OpenVSX）中没有该扩展，命令会失败
- 此时需要使用方案二的方法 A（手动下载 VSIX 文件）

安装完成后：
1. 在 Web 界面中：`Ctrl+Shift+P` → `Configure Display Language` → 选择 `中文(简体)`
2. 重启服务器

---

### 方案三：配置使用 Microsoft Marketplace（高级）

如果 OpenVSX 上没有语言包，可以尝试配置使用 Microsoft Marketplace：

> ⚠️ **注意**：OpenVSCode Server 默认使用 OpenVSX，修改扩展市场配置可能需要修改源码并重新编译。

#### 临时解决方案：使用环境变量

某些版本可能支持通过环境变量配置扩展市场，但这不是标准功能。

---

## 验证安装

安装并重启后，检查以下内容确认是否成功：

1. **界面语言**：菜单、按钮、提示等应该显示为中文
2. **命令面板**：`Ctrl+Shift+P` 中的命令应该显示中文
3. **设置界面**：设置页面应该显示中文

如果部分内容仍然是英文，可能是：
- 语言包版本不完整
- 某些扩展没有中文翻译
- 需要更新语言包

---

## 常见问题

### Q1: 安装语言包后仍然显示英文？

**解决方案：**
1. 确认已重启服务器（不是刷新浏览器）
2. 检查语言设置：`Ctrl+Shift+P` → `Configure Display Language` → 确认选择了 `zh-cn`
3. 检查扩展是否已启用：扩展视图 → 已安装 → 确认语言包已启用

### Q2: 扩展市场找不到语言包？

**可能原因：**
- OpenVSX 上可能没有该语言包
- 网络问题导致无法加载扩展列表

**解决方案：**
1. 尝试使用方案二（手动下载 VSIX 文件）
2. 检查网络连接
3. 尝试使用其他镜像源（如果支持）

### Q3: 重启后语言又变回英文？

**解决方案：**
1. 检查用户设置中的语言配置：
   - 打开设置（`Ctrl+,`）
   - 搜索 `locale`
   - 确认 `locale` 设置为 `zh-cn`
2. 检查配置文件：`~/.openvscode-server/User/settings.json` 中应该有：
   ```json
   {
     "locale": "zh-cn"
   }
   ```

### Q4: 部分界面仍然是英文？

**原因：**
- 某些扩展或功能可能没有完整的中文翻译
- 语言包版本可能较旧

**解决方案：**
1. 更新语言包到最新版本
2. 检查是否有其他语言包扩展可用

---

## 其他语言

如果需要其他语言（如繁体中文、日语等），可以搜索对应的语言包：

- **繁体中文**：`MS-CEINTL.vscode-language-pack-zh-hant`
- **日语**：`MS-CEINTL.vscode-language-pack-ja`
- **韩语**：`MS-CEINTL.vscode-language-pack-ko`
- **法语**：`MS-CEINTL.vscode-language-pack-fr`

搜索格式：`@id:MS-CEINTL.vscode-language-pack-{语言代码}`

---

## 快速参考

```bash
# 1. 在扩展市场搜索
Chinese (Simplified) Language Pack

# 2. 或直接搜索扩展 ID
@id:MS-CEINTL.vscode-language-pack-zh-hans

# 3. 安装后配置语言
Ctrl+Shift+P → Configure Display Language → 选择 中文(简体)

# 4. 重启服务器（重要！）
```

---

## 相关链接

- [OpenVSX 市场](https://open-vsx.org/)
- [Microsoft Marketplace](https://marketplace.visualstudio.com/)
- [VSCode 语言包文档](https://code.visualstudio.com/docs/getstarted/locales)

---

如果以上方案都无法解决问题，请检查：
1. OpenVSCode Server 版本是否支持语言包
2. 服务器日志中是否有相关错误信息
3. 扩展市场配置是否正确

