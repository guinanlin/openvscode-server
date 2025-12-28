# OpenVSCode Server 快速启动指南

## 前置条件

- ✅ Node.js 22.x
- ✅ 已安装依赖：`npm install`
- ✅ 已编译代码：`npm run compile` 或 `yarn compile`

## 启动方式

### 方式 1：服务器模式（推荐）

提供完整的服务器和 Web 界面，功能最全：

```bash
./scripts/code-server.sh --without-connection-token --port 3000
```

**特点：**
- ✅ 支持文件系统访问
- ✅ 完整的扩展支持
- ✅ 自动编译（通过 preLaunch.js）

**访问：** `http://你的服务器IP:3000`

---

### 方式 2：纯 Web 模式

纯浏览器运行，用于测试 Web 功能：

```bash
./scripts/code-web.sh --port 3000
```

**特点：**
- ✅ 纯浏览器环境
- ✅ 适合 Web 功能开发
- ✅ 自动编译（通过 preLaunch.js）

**访问：** `http://你的服务器IP:3000`

---

## 常用参数

```bash
# 指定端口
--port 3000

# 无需连接令牌（开发模式）
--without-connection-token

# 禁用扩展
--disable-extensions

# 指定工作目录
--folder-uri file:///path/to/your/project

# 指定监听地址（默认已设置为 0.0.0.0）
--host 0.0.0.0
```

---

## 开发模式（热重载）

如果需要修改代码并自动重新编译：

**终端 1** - 监视模式（保持运行）：
```bash
export NODE_ENV=development
export VSCODE_DEV=1
yarn watch
```

**终端 2** - 启动服务器：
```bash
./scripts/code-server.sh --without-connection-token --port 3000
```

修改代码后保存 → 自动重新编译 → 刷新浏览器生效。

---

## 注意事项

1. **首次运行**：如果 `out` 目录不存在，脚本会自动运行 `npm run compile`
2. **内存要求**：编译需要至少 4GB 内存，推荐 8GB+
3. **网络访问**：默认监听 `0.0.0.0:3000`，可从其他机器访问

---

## 快速参考

```bash
# 编译代码（首次或更新后）
yarn compile

# 启动服务器（推荐）
./scripts/code-server.sh --without-connection-token --port 3000

# 启动 Web 模式
./scripts/code-web.sh --port 3000

# 开发模式（热重载）
yarn watch  # 终端 1
./scripts/code-server.sh --without-connection-token --port 3000  # 终端 2
```

