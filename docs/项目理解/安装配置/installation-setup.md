# OpenVSCode Server 完整安装配置指南

本文档详细说明如何配置系统环境和依赖，以便成功执行 `npm install` 和编译 openvscode-server 项目。

## 目录
1. [系统依赖安装](#系统依赖安装)
2. [配置中国镜像源](#配置中国镜像源)
3. [环境变量配置](#环境变量配置)
4. [执行安装](#执行安装)
5. [常见问题](#常见问题)

---

## 系统依赖安装

### Debian/Ubuntu 系统依赖

安装编译原生 Node.js 模块所需的系统包：

```bash
sudo apt update
sudo apt install -y \
  build-essential \
  python3 \
  pkg-config \
  libkrb5-dev \
  libx11-dev \
  libxkbfile-dev
```

**各包说明：**
- `build-essential`: 包含 gcc/g++ 等编译工具，用于编译原生模块
- `python3`: node-gyp 需要 Python 来构建原生模块
- `pkg-config`: 查找系统库的配置信息
- `libkrb5-dev`: Kerberos 认证库的开发文件（用于 `kerberos` npm 包）
- `libx11-dev`: X11 库的开发文件（用于 `native-keymap` npm 包）
- `libxkbfile-dev`: XKB 文件库的开发文件（用于 `native-keymap` npm 包）

---

## 配置中国镜像源

### 1. 配置 APT 源（Debian/Ubuntu）

#### 备份原配置
```bash
sudo cp /etc/apt/sources.list.d/debian.sources /etc/apt/sources.list.d/debian.sources.bak
```

#### 编辑 Debian 源配置
```bash
sudo nano /etc/apt/sources.list.d/debian.sources
```

将内容替换为（使用清华大学镜像）：

```plaintext
Types: deb
URIs: https://mirrors.tuna.tsinghua.edu.cn/debian
Suites: bookworm bookworm-updates
Components: main contrib non-free non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg

Types: deb
URIs: https://mirrors.tuna.tsinghua.edu.cn/debian-security
Suites: bookworm-security
Components: main contrib non-free non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg
```

**其他可选镜像：**
- 中科大：`https://mirrors.ustc.edu.cn/debian`
- 阿里云：`https://mirrors.aliyun.com/debian`
- 腾讯云：`https://mirrors.cloud.tencent.com/debian`

#### 更新软件包列表
```bash
sudo apt clean
sudo rm -rf /var/lib/apt/lists/*
sudo apt update
```

#### 禁用 Node.js 官方源（如果使用 nvm）
如果使用 nvm 管理 Node.js，可以禁用 apt 的 Node.js 源：

```bash
sudo mv /etc/apt/sources.list.d/nodesource.list /etc/apt/sources.list.d/nodesource.list.disabled
```

---

### 2. 配置 NPM 镜像源

编辑项目根目录下的 `.npmrc` 文件：

```bash
cd openvscode-server
nano .npmrc
```

添加以下内容：

```ini
registry=https://registry.npmmirror.com/
electron_mirror=https://npmmirror.com/mirrors/electron/
```

**说明：**
- `registry`: npm 包镜像源（淘宝镜像，已迁移至 npmmirror.com）
- `electron_mirror`: Electron 二进制文件镜像源

**验证配置：**
```bash
npm config get registry
# 应该输出: https://registry.npmmirror.com/
```

---

## 环境变量配置

### GitHub Token 配置（推荐）

`@vscode/ripgrep` 等包在安装时需要从 GitHub Releases 下载二进制文件，GitHub API 有速率限制：
- 未认证：60 次/小时
- 已认证：5000 次/小时

**创建 GitHub Personal Access Token：**
1. 访问：https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 填写 Note（例如："npm install for openvscode-server"）
4. 选择过期时间
5. **权限（Scopes）**：可以不勾选任何权限，或只勾选 `public_repo`
   - 注意：仅用于提升 API 速率限制，不需要特殊权限
6. 点击 "Generate token"
7. 复制生成的 token（只显示一次）

**设置环境变量：**

临时设置（当前终端会话）：
```bash
export GITHUB_TOKEN=你的token
```

永久设置（推荐）：
```bash
echo 'export GITHUB_TOKEN=你的token' >> ~/.bashrc
source ~/.bashrc
```

---

## 执行安装

### 1. 确保 Node.js 版本

```bash
# 检查 Node.js 版本（需要 22.x）
node -v

# 如果使用 nvm
nvm use 22
```

### 2. 清理之前的安装（如有问题）

```bash
cd openvscode-server
rm -rf node_modules package-lock.json
```

### 3. 执行 npm install

**基本安装（包含所有依赖）：**
```bash
npm install
```

**如果遇到 GitHub API 速率限制，可以跳过 Playwright 浏览器下载：**
```bash
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install
```

安装完成后，如果需要 Playwright 浏览器，可以单独安装：
```bash
npm run playwright-install
```

### 4. 验证安装

```bash
# 检查 node_modules 大小（通常 1-2GB）
du -sh node_modules

# 检查依赖数量
find node_modules -maxdepth 1 -type d | wc -l
```

---

## 常见问题

### 1. 编译错误：缺少 g++ 编译器

**错误信息：**
```
make: g++: No such file or directory
```

**解决方案：**
```bash
sudo apt install -y build-essential
```

---

### 2. 编译错误：缺少 Kerberos 开发库

**错误信息：**
```
fatal error: gssapi/gssapi.h: No such file or directory
```

**解决方案：**
```bash
sudo apt install -y libkrb5-dev
```

---

### 3. 编译错误：缺少 X11 开发库

**错误信息：**
```
/bin/sh: 1: pkg-config: not found
Call to 'pkg-config x11 xkbfile --libs' returned exit status 127
```

**解决方案：**
```bash
sudo apt install -y pkg-config libx11-dev libxkbfile-dev
```

---

### 4. GitHub API 速率限制（403 错误）

**错误信息：**
```
npm error Request failed: 403
npm error GET https://api.github.com/repos/microsoft/ripgrep-prebuilt/releases/tags/...
```

**解决方案：**
1. 设置 `GITHUB_TOKEN` 环境变量（见上方说明）
2. 或等待 1 小时后重试（速率限制会重置）

---

### 5. npm install 运行很久没有响应

**可能原因：**
- Playwright 正在下载浏览器文件（较大，300MB-1GB+）
- 网络速度较慢

**解决方案：**
```bash
# 跳过浏览器下载，先完成其他依赖安装
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install

# 安装完成后单独下载浏览器
npm run playwright-install
```

**检查进度：**
```bash
# 查看 node_modules 大小变化
watch -n 5 "du -sh node_modules"
```

---

### 6. node_modules 目录不一致错误

**错误信息：**
```
npm error ENOTEMPTY: directory not empty, rename 'node_modules/xxx'
```

**解决方案：**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 完整安装流程示例

```bash
# 1. 安装系统依赖
sudo apt update
sudo apt install -y build-essential python3 pkg-config libkrb5-dev libx11-dev libxkbfile-dev

# 2. 配置 APT 源（如需要）
# ... 参考上方配置步骤 ...

# 3. 配置 NPM 源
cd openvscode-server
cat >> .npmrc << EOF
registry=https://registry.npmmirror.com/
electron_mirror=https://npmmirror.com/mirrors/electron/
EOF

# 4. 设置 GitHub Token（推荐）
export GITHUB_TOKEN=你的token
# 或添加到 ~/.bashrc 永久设置

# 5. 安装依赖
npm install

# 6. 验证安装
du -sh node_modules
```

---

## 总结

成功执行 `npm install` 需要：

1. ✅ **系统依赖**：build-essential, python3, pkg-config, libkrb5-dev, libx11-dev, libxkbfile-dev
2. ✅ **中国镜像源**：APT 源（清华大学/中科大）和 NPM 源（npmmirror.com）
3. ✅ **GitHub Token**（推荐）：提升 API 速率限制
4. ✅ **Node.js 22.x**：确保使用正确版本

完成以上配置后，`npm install` 应该能够正常完成。

