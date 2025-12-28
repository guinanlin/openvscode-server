# OpenVSCode Server 语言包和扩展存储位置

## 📁 目录结构概览

OpenVSCode Server 的扩展和语言包存储在以下位置：

### 1. 用户安装的扩展（包括语言包）

**默认位置：**
```bash
~/.openvscode-server/extensions/
```

**完整路径示例：**
```bash
/home/devbox/.openvscode-server/extensions/
```

**中文语言包具体位置：**
```bash
~/.openvscode-server/extensions/ms-ceintl.vscode-language-pack-zh-hans-1.106.0/
```

### 2. 内置扩展（系统扩展）

**位置：**
```bash
{项目根目录}/extensions/
```

**示例：**
```bash
/home/devbox/project/openvscode-server/extensions/
```

### 3. 用户数据目录

**默认位置：**
```bash
~/.openvscode-server/
```

**子目录结构：**
```
~/.openvscode-server/
├── extensions/              # 用户安装的扩展
│   └── ms-ceintl.vscode-language-pack-zh-hans-1.106.0/
│       ├── package.json
│       ├── translations/    # 翻译文件
│       └── ...
├── data/                    # 用户数据
│   ├── User/
│   │   ├── settings.json    # 用户设置（包含 locale 配置）
│   │   └── ...
│   └── ...
└── CachedExtensionVSIXs/    # 缓存的扩展 VSIX 文件
```

---

## 🔍 如何查找语言包位置

### 方法 1：使用命令行查找

```bash
# 查找中文语言包
find ~/.openvscode-server/extensions -name "*language-pack-zh*" -type d

# 列出所有已安装的扩展
ls -la ~/.openvscode-server/extensions/

# 查看语言包详细信息
ls -la ~/.openvscode-server/extensions/ms-ceintl.vscode-language-pack-zh-hans-*/
```

### 方法 2：在 OpenVSCode Server 中查看

1. 按 `Ctrl+Shift+X` 打开扩展视图
2. 搜索 `Chinese (Simplified) Language Pack`
3. 点击扩展，查看详情
4. 在详情页可以看到扩展的安装路径

### 方法 3：使用命令行工具

```bash
# 列出所有已安装的扩展
./scripts/code-server.sh --list-extensions

# 定位特定扩展
./scripts/code-server.sh --locate-extension ms-ceintl.vscode-language-pack-zh-hans
```

---

## 📂 语言包文件结构

安装后的中文语言包目录结构：

```
~/.openvscode-server/extensions/ms-ceintl.vscode-language-pack-zh-hans-1.106.0/
├── package.json                    # 扩展清单文件
├── README.md
├── CHANGELOG.md
└── translations/
    └── main.i18n.json             # 主要翻译文件
        └── zh-cn/                 # 简体中文翻译
            ├── translations.json
            └── ...
```

**关键文件：**
- `package.json` - 包含扩展元数据和本地化配置
- `translations/main.i18n.json` - 包含所有翻译字符串

---

## 🗂️ 自定义路径

### 通过环境变量自定义

```bash
# 自定义扩展目录
export VSCODE_EXTENSIONS=/path/to/custom/extensions

# 自定义用户数据目录
export VSCODE_APPDATA=/path/to/custom/appdata
```

### 通过命令行参数自定义

```bash
# 指定扩展目录
./scripts/code-server.sh --extensions-dir /path/to/extensions

# 指定服务器数据目录
./scripts/code-server.sh --server-data-dir /path/to/server-data

# 指定用户数据目录
./scripts/code-server.sh --user-data-dir /path/to/user-data
```

---

## 🔧 语言包配置位置

语言设置存储在用户配置文件中：

**配置文件路径：**
```bash
~/.openvscode-server/data/User/settings.json
```

**配置内容：**
```json
{
  "locale": "zh-cn"
}
```

**或者通过 argv.json（如果使用）：**
```bash
~/.openvscode-server/data/argv.json
```

**内容：**
```json
{
  "locale": "zh-cn"
}
```

---

## 📊 路径优先级

OpenVSCode Server 按以下优先级查找扩展目录：

1. **命令行参数** `--extensions-dir`（最高优先级）
2. **环境变量** `VSCODE_EXTENSIONS`
3. **便携模式** `VSCODE_PORTABLE/extensions`
4. **默认路径** `~/.openvscode-server/extensions`（最低优先级）

---

## 🛠️ 实用命令

### 查看当前扩展目录

```bash
# 方法 1：检查环境变量
echo $VSCODE_EXTENSIONS

# 方法 2：查看默认路径
ls -la ~/.openvscode-server/extensions/

# 方法 3：在服务器运行时查看日志
# 启动服务器时会输出扩展目录路径
```

### 备份语言包

```bash
# 备份整个扩展目录
tar -czf extensions-backup.tar.gz ~/.openvscode-server/extensions/

# 只备份中文语言包
tar -czf chinese-lang-pack.tar.gz ~/.openvscode-server/extensions/ms-ceintl.vscode-language-pack-zh-hans-*/
```

### 删除语言包

```bash
# 方法 1：使用命令行卸载
./scripts/code-server.sh --uninstall-extension ms-ceintl.vscode-language-pack-zh-hans

# 方法 2：手动删除目录
rm -rf ~/.openvscode-server/extensions/ms-ceintl.vscode-language-pack-zh-hans-*
```

---

## 📝 检查清单

要确认语言包是否正确安装，检查以下位置：

- [ ] 扩展目录存在：`~/.openvscode-server/extensions/`
- [ ] 语言包目录存在：`~/.openvscode-server/extensions/ms-ceintl.vscode-language-pack-zh-hans-*/`
- [ ] 翻译文件存在：`translations/main.i18n.json`
- [ ] 用户配置包含：`"locale": "zh-cn"` 在 `~/.openvscode-server/data/User/settings.json`

---

## 🔗 相关路径

- **用户设置**：`~/.openvscode-server/data/User/settings.json`
- **工作区设置**：`{工作区目录}/.vscode/settings.json`
- **全局存储**：`~/.openvscode-server/data/User/globalStorage/`
- **扩展缓存**：`~/.openvscode-server/data/CachedExtensionVSIXs/`
- **日志文件**：`~/.openvscode-server/logs/`

---

## 💡 提示

1. **路径可能因配置而异**：如果使用了自定义路径，实际位置会不同
2. **多用户环境**：每个用户都有自己的 `~/.openvscode-server/` 目录
3. **Docker 环境**：在 Docker 中，路径通常在容器的 `/home/.openvscode-server/`
4. **权限问题**：确保用户对扩展目录有读写权限

---

## 🐛 故障排除

### 问题：找不到语言包

```bash
# 检查扩展目录是否存在
ls -la ~/.openvscode-server/extensions/

# 检查语言包是否安装
./scripts/code-server.sh --list-extensions | grep language-pack
```

### 问题：语言包损坏

```bash
# 删除并重新安装
./scripts/code-server.sh --uninstall-extension ms-ceintl.vscode-language-pack-zh-hans
./scripts/code-server.sh --install-extension ms-ceintl.vscode-language-pack-zh-hans
```

### 问题：权限错误

```bash
# 修复权限
chmod -R 755 ~/.openvscode-server/extensions/
```

---

如果需要查找其他信息，可以使用：
- `./scripts/code-server.sh --help` 查看所有可用命令
- 查看服务器启动日志获取路径信息

